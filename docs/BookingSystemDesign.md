# Booking System — System Design

> Status: **target design** (written 2026-07-27). This is the booking system as it SHOULD be —
> the spec for a re-implementation, not documentation of what exists today. Where the current
> code already matches, §12 says so; where it differs, §12 lists the exact delta. Companion:
> `GeneralSystemDesignRule.md` (data rules — cited per decision, never restated).
>
> Audience: the LLM/developer implementing it. Every rule here is a decision, not an option.
> When something was deliberately left out, §11 names it and why — do not add it back without
> a real need.

## 0. Operating principles

Four principles generate every rule below. When a future change is unclear, re-derive from
these instead of pattern-matching on Airbnb:

1. **The machine moves the booking; humans only decide.** Time-based transitions (check-in,
   check-out, request expiry) are cron work — there is never a "mark as checked in" button.
   Humans make exactly the decisions machines can't: accept, decline, cancel, and why.
2. **One status field, one writer per transition.** Every state change is a single Convex
   mutation (serializable transaction) that validates the transition, patches the row, tracks
   analytics, and sends the emails — no split-brain between a status field and side flags.
3. **Policy is data, snapshotted at booking time.** Cancellation windows and response windows
   are config constants, but each booking freezes the values it was created under. Changing
   platform policy never retroactively changes a live booking — same principle as the order
   price snapshot in `GeneralSystemDesignRule.md` § exceptions.
4. **Cash is a first-class payment method, and the design is honest about it.** With cash
   there is no financial lever — no deposits to keep, no penalties to charge. The levers are
   policy, visibility (flags, counts), and account standing. Do not design refund mechanics
   that pretend cash bookings can be charged.

## 1. The two booking modes

Per-listing setting, host-owned: the existing `apartments.instantBooking: boolean`
(`false` = request-to-book, default; `true` = instant). No enum rename — one boolean.

### Request-to-book (default)

```
guest requests → host has HOST_RESPONSE_HOURS to answer → confirm | decline | (expire)
```

- The request is **not a reservation**: dates are not blocked for other guests, and multiple
  pending requests may overlap the same dates (§6).
- The host answering window is `BOOKING_POLICY.HOST_RESPONSE_HOURS` (48h). Expiry →
  `auto_declined` by cron, guest emailed. A request the host never sees costs the guest at
  most 48h — that bound is the whole point of the window.
- **Online payment**: a card hold (authorization) is placed at request time and captured only
  on confirm (§5). 48h is comfortably inside the ~7-day validity of a card authorization —
  do not raise `HOST_RESPONSE_HOURS` past 5 days without revisiting §5.

### Instant book (host opt-in)

```
guest books → availability re-checked in the mutation → confirmed immediately
```

- No pending state, no host decision. Online payment is captured immediately; cash bookings
  confirm with `paymentStatus: 'on_arrival'`.
- Why opt-in and not default: hosts on this platform hand over physical keys to strangers.
  Request mode is the trust default; instant book is the reward hosts unlock when they want
  volume over vetting. The flag costs one branch in `createBooking` and nothing anywhere
  else — every downstream state is identical to a confirmed request.

## 2. The state machine

### States

```
                         ┌──────────► declined        (host said no)
                         ├──────────► auto_declined   (48h expired — system)
   ┌─────────┐           ├──────────► withdrawn       (guest pulled the request)
   │ pending ├───────────┤
   └─────────┘           ▼
                    ┌───────────┐
   (instant book) ─►│ confirmed ├────► cancelled      (guest, host, or admin — see §4)
                    └─────┬─────┘
                          ▼  (cron, check-in date)
                    ┌────────────┐
                    │ checked_in ├───► cancelled      (admin only — emergency brake)
                    └─────┬──────┘
                          ▼  (cron, day after check-out date)
                    ┌─────────────┐
                    │ checked_out │                    (terminal, immutable)
                    └─────────────┘
```

Eight statuses: `pending`, `confirmed`, `checked_in`, `checked_out`, `declined`,
`auto_declined`, `withdrawn`, `cancelled`.

- **`withdrawn` is a distinct status, not `cancelled` with a flag.** A guest pulling a
  request the host hasn't answered is a non-event (no penalty, no stats impact, polite email).
  A guest cancelling a confirmed stay is a real event (dates were blocked, host planned).
  Collapsing them poisons every list, count, and analytics read that follows.
- **`cancelled` carries its discriminators**: `cancelledBy: 'guest' | 'host' | 'system' |
'admin'`, `cancelledAt`, `cancelReason` (required for host and admin, optional for guest),
  and `lateCancellation: boolean` (§4). One terminal status + discriminators beats four
  bespoke cancelled-variants — displays branch on `cancelledBy`, state logic doesn't.
- **Terminal statuses**: `checked_out`, `declined`, `auto_declined`, `withdrawn`,
  `cancelled`. `isTerminalBookingStatus` is the single source of truth; nothing transitions
  out of a terminal status, ever, including admins. A wrong terminal state is fixed by
  support communication, not by resurrecting rows.

### Invariants (enforce in code, cite by number in comments)

- **I1** — Only the lifecycle cron writes `checked_in` and `checked_out`.
- **I2** — Every actor-driven terminal transition writes `cancelledBy/At` (+ `cancelReason`
  where required) in the same patch as the status. No status write without its evidence.
- **I3** — Every transition is one mutation: validate → patch → analytics → emails. Emails
  and analytics never precede the patch.
- **I4** — All booking writes go through the trigger-wrapped constructors from
  `@/convex/functions` (`GeneralSystemDesignRule.md` § table counts) — aggregates and
  analytics depend on it.
- **I5** — Transition guards live in `src/shared/features/booking/utils/` (pure, no Convex
  imports) and are the SAME functions the UI uses to show/hide buttons. The backend re-checks
  what the frontend displayed; neither duplicates the rule.
- **I6** — `status` alone answers "what is this booking now". No consumer may need to join
  discriminators to know the state — discriminators only explain _how it got there_.

## 3. Time, dates, and the lifecycle cron

- **Dates are ISO `YYYY-MM-DD` strings, compared lexicographically.** No timestamps for
  stay boundaries — check-in _time_ (`apartment.checkInTime`) is display copy, not state.
- **"Today" is computed in `BOOKING_POLICY.PROPERTY_TIMEZONE` (`'Europe/Belgrade'`)** — a
  config constant, not the server's UTC clock. Every listing on this platform is physically
  in one city; a guest's browser timezone must never shift which day a stay flips states.
  This is the one deliberate divergence from the current UTC-based cron: a 23:00 UTC cron
  run is already "tomorrow" in Belgrade for two hours of every night, and stays flip a day
  early/late at the edges.
- **The cron** (hourly, idempotent, capped per run):
  1. `confirmed` with `today >= checkInDate` → `checked_in`.
  2. `confirmed` / `checked_in` with `today > checkOutDate` → `checked_out` (the
     `confirmed` branch self-heals a missed run; checkout fires the day _after_ the
     check-out date so departure morning still counts as staying).
  3. `pending` past `pendingExpiresAt` → `auto_declined` (+ guest email, `cancelledBy:
'system'`) and, for online payments, release the card hold (§5).
- **Windows snapshot**: `pendingExpiresAt` is stamped at creation from the policy snapshot
  (§7), not recomputed from live config at expiry time.

## 4. Cancellation policy — who, when, consequence

The single most important table in this document. `D` = days until check-in, computed in the
property timezone against the booking's **snapshotted** policy values.

| Actor             | Booking state    | When                             | Allowed?      | Consequence                                                                                                                                                                                                        |
| ----------------- | ---------------- | -------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Guest**         | `pending`        | any time before host answers     | ✅ withdraw   | Status `withdrawn`. Non-event: no penalty, hold released (online), host politely notified.                                                                                                                         |
| **Guest**         | `confirmed`      | `D >= FREE_CANCEL_DAYS` (7)      | ✅ cancel     | On-time. Full refund (online) / nothing owed (cash). `lateCancellation: false`.                                                                                                                                    |
| **Guest**, cash   | `confirmed`      | `D < FREE_CANCEL_DAYS`           | ❌            | **Window closed.** A late cash cancel can't be compensated — nothing is collectable — so cancellation rights end where compensation ends. The page says to contact the host; the host (or admin) can still cancel. |
| **Guest**, online | `confirmed`      | `0 < D < FREE_CANCEL_DAYS`       | ✅ cancel     | **Non-refundable.** `lateCancellation: true`; the host keeps the capture. Allowed because the host is made whole either way — and gets the dates back to resell.                                                   |
| **Guest**         | `confirmed`      | check-in day or later (`D <= 0`) | ❌            | Self-serve closed. The stay is starting; only the host (day-of, before cron flips it) or admin can act.                                                                                                            |
| **Guest**         | `checked_in`     | —                                | ❌            | Mid-stay problems are host/admin conversations, not buttons.                                                                                                                                                       |
| **Host**          | `pending`        | within response window           | ✅ decline    | Status `declined`, reason required (guest reads it). Hold released (online).                                                                                                                                       |
| **Host**, cash    | `confirmed`      | `D >= FREE_CANCEL_DAYS` (7)      | ✅ cancel     | Free — outside the window the guest can easily rebook. Tracked per host (§8).                                                                                                                                      |
| **Host**, cash    | `confirmed`      | `0 < D < FREE_CANCEL_DAYS`       | ✅ with proof | The no-show escape valve, unabusable: unlocks ONLY after a stay-confirmation request (§11) sat unanswered for 24h. Guest confirms → re-locked. No timestamped ignored request, no cancel. Tracked per host (§8).   |
| **Host**, online  | `confirmed`      | `D >= FREE_CANCEL_DAYS` (7)      | ✅ cancel     | Reason required. Guest gets **full refund always** — host cancellations are never the guest's cost. Tracked per host (§8).                                                                                         |
| **Host**, online  | `confirmed`      | `D < FREE_CANCEL_DAYS`           | ❌            | **The guest's paid booking is ironclad.** Only the guest (forfeiting the payment) or the admin emergency brake can end it — a host emergency inside the window is a support conversation, not a button.            |
| **Host**          | `checked_in`     | —                                | ❌            | A guest physically in the apartment is not removable by button. Admin emergency brake only.                                                                                                                        |
| **Admin**         | any non-terminal | any time                         | ✅ cancel     | Emergency brake. Reason required, both parties emailed, audit-logged, full refund (online).                                                                                                                        |
| anyone            | any terminal     | —                                | ❌            | Terminal is terminal (I2/§2).                                                                                                                                                                                      |

Design notes, in order of how often someone will question them:

- **Why does the window split by payment method?** Because the host's protection differs.
  On an **online** booking a late cancel costs the guest the full payment — the host is made
  whole and gets the dates back to resell, so there is no reason to forbid it. On a **cash**
  booking there is nothing to forfeit: a late cancel takes the host's near-term dates with
  zero compensation, so inside the window the booking is a commitment and self-serve closes.
  Accepted trade-off, decided deliberately: a cash guest who won't come may now no-show
  silently instead of cancelling — the host's day-of cancel and the (deferred) no-show
  reporting carry that case. The 7-day number is host-protective by intent (industry
  "moderate" is ~5); soften to 5 only if guest conversion measurably suffers — one constant.
- **Why is the free-cancel window one number (7 days) and not host-tiered
  (flexible/moderate/strict)?** Cognitive load — for guests ("what's the policy on THIS
  listing?"), for hosts (a choice they must understand), and for support. One platform-wide
  window is comprehensible by everyone including the Belgrade ops team. The policy snapshot
  (§7) means per-listing tiers can be added later without touching any existing booking —
  the seam is already there. Start with one number.
- **The verification norm (cash).** From the moment a booking is `confirmed`, the host has
  the guest's contact details and **may reach out at any time — WhatsApp or email — simply
  to confirm the stay is still on**. This is normal, encouraged behaviour, not harassment
  of a confirmed guest. If a cash guest goes unresponsive to a reasonable verification
  attempt, cancelling is the sanctioned response — that is exactly what the host's
  cash window exists for. "Unresponsive" is PROVABLE, not claimed: the cash-inside-window
  cancel only unlocks after an in-product stay-confirmation request (§11) has sat
  unanswered for `STAY_CONFIRMATION_UNLOCK_HOURS` (24h) — informal WhatsApp/email contact
  is still encouraged, but the request button is what opens the cancel. Host cancellations
  remain tracked (§8), so even the proven valve can't quietly become a habit.
- **The 7-day boundary locks in whoever bears the risk.** One constant, four consequences:
  on cash the GUEST loses the right to cancel inside it (the host is protected from a
  no-compensation cancellation); on online the HOST loses the right to cancel inside it
  (the guest's paid stay is protected when plans are least recoverable). Neither side's
  lock has a workaround button — that is the point.
- **Why full refund on host cancel, no exceptions?** The guest did nothing wrong and may
  have booked flights. Anything less converts a host convenience into a guest tax. The
  counterweight is visibility: `cancelledBy: 'host'` counts surface on the admin host view.
- **No cancellation fees anywhere.** Fees (platform monetization generally) are a config
  seam deliberately outside this document — §10.

## 5. Payments — cash and online, decoupled from booking state

### The principle

`status` says where the **stay** is; `paymentStatus` says where the **money** is. They
correlate but never merge — a confirmed booking may be `on_arrival` (cash) or `paid`
(online), and displays always show both.

### Method

`paymentMethod: 'cash' | 'online'` — chosen by the guest at booking time from what the
listing accepts (`apartment.paymentMethod: 'cash' | 'online' | 'both'`). Frozen on the
booking; never editable after creation (changing how you pay = cancel and rebook, §11).

### Payment states

`paymentStatus: 'on_arrival' | 'awaiting' | 'authorized' | 'paid' | 'released' | 'refunded'`

> Amended by `PaymentsSystemDesign.md` §3: `awaiting` = online checkout opened but not yet
> confirmed by webhook — the booking is invisible (no emails, no host clock) until the
> provider confirms the authorization. That document now owns the payment flows end to end.

| State        | Meaning                                                           | Reachable how (`PaymentsSystemDesign.md` §3 owns the flow)                                             |
| ------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `on_arrival` | Cash — guest pays the host at the property. Terminal for cash.    | Set at creation for `paymentMethod: 'cash'`. Never changes: the platform does not witness cash.        |
| `awaiting`   | Online — checkout open, nothing confirmed, booking **invisible**. | Set at creation for every online booking (request AND instant). Reaped if abandoned past the deadline. |
| `authorized` | Online — card hold placed, no money moved.                        | Authorization **webhook**, request mode — the host's 48h clock starts here, not at row creation.       |
| `paid`       | Online — captured.                                                | Capture in `confirmBooking` (request mode) or in the authorization webhook (instant).                  |
| `released`   | Online — hold released, no money ever moved.                      | Decline, auto-decline, withdraw, or any cancel of an `authorized` booking.                             |
| `refunded`   | Online — captured then returned.                                  | On-time guest cancel, any host cancel, any admin cancel of a `paid` booking.                           |

Late guest cancel of a `paid` booking: `paymentStatus` **stays `paid`** — the host keeps the
capture. That is the entire online-side implementation of the late-cancel consequence.

### The provider seam

> Ownership moved: `PaymentsSystemDesign.md` now owns the full adapter contract (§7 there),
> checkout flow, progressive host onboarding, payouts, and webhooks. The sketch below
> remains as the booking-side constraints it originally stated; where the two differ, the
> payments document wins.

The payment provider is **not chosen in this document**. The full adapter contract lives
in `PaymentsSystemDesign.md` §7; the booking-side constraints it must honor:

- One adapter module (`src/convex/payments/adapter.ts` — §7 there) owns every provider
  call. Booking mutations call the adapter, never the provider SDK. Swapping Stripe for
  anything else is one file.
- Provider calls are **Convex actions** (they hit external HTTP); state patches happen in
  mutations after the provider confirms — for payment state, that confirmation is the
  webhook (`PaymentsSystemDesign.md` §0.3/§6). A booking is never `paid` on our side
  before the provider says captured.
- Failure handling is boring by design: a checkout the guest never completes leaves an
  `awaiting` row nobody was told about, reaped at its deadline
  (`PaymentsSystemDesign.md` §3 — no error to show, because no promise was made). Capture
  fails on confirm (rare — hold expired/card died) → the confirm mutation fails whole,
  booking stays `pending`, host sees "payment failed, ask the guest to rebook". Refund
  fails → `paymentStatus` keeps its pre-refund value and the row is flagged for admin
  (`/admin/bookings` filter). No retry queues, no saga framework — volumes are human-scale
  and every failure has a human on both ends.
- **Until a provider is integrated**, listings simply don't offer `online`. The schema, the
  states, and the UI branches ship now; `'online'` appears in a listing's options the day
  the adapter exists. No mock payment flows.

### Cash — what the platform does and doesn't know

The platform records that payment is `on_arrival` and shows both parties the amount
(snapshot, §7). It does not track whether cash actually changed hands — no "mark paid"
button for hosts (it would be unverifiable data entry theater). If a cash guest no-shows,
the host cancels day-of (§4) or reports it (§11, deferred).

## 6. Availability and double-booking prevention

- **Blocking states are exactly `confirmed` and `checked_in`.** `pending` blocks nothing —
  requests are questions, not reservations. (`checked_out` frees nothing early because
  checkout flips the day after the stay ends.)
- **Availability is checked twice, both times inside the deciding mutation:**
  1. `createBooking`: requested range vs blocking bookings + host manual blocks. Rejects
     with `DATES_UNAVAILABLE`.
  2. `confirmBooking` / instant-book path: the SAME check re-runs before the patch. Two
     overlapping requests can both sit `pending`; the first confirm wins, and Convex's
     serializable mutations make the re-check + patch atomic — there is no gap for a second
     confirm to slip through.
- **On confirm, overlapping `pending` requests on the same listing are auto-declined in the
  same mutation** (`cancelledBy: 'system'`, distinct email copy: "the host confirmed another
  request for these dates"). Leaving them to expire naturally would waste up to 48h of the
  losing guests' search time for zero benefit.
- **Host manual blocks** (own calendar: personal use, maintenance) are rows in a separate
  small `apartmentBlocks` table (`apartmentId`, `startDate`, `endDate`, index by apartment),
  not fake bookings — fake bookings would leak into every booking list, count, and stat.
  The availability check reads both tables; nothing else ever joins them.

## 7. Data model (deltas from the current schema in **bold**)

```
bookings: {
  bookingCode: string                       // "BK7X9M2P4Q" — support handle + guest access
  apartmentId: Id<'apartments'>             // **required** (dummy-data era over; slug stays for URLs)
  apartmentSlug: string
  hostId: string
  guestId?: string                          // set when the guest has an account

  guestFirstName / guestLastName / guestEmail / guestPhone / specialRequests?

  checkInDate / checkOutDate: string        // ISO dates
  numberOfAdults / numberOfChildren / numberOfNights: number

  // Price snapshot — frozen at creation, invoice-style (GeneralSystemDesignRule § exceptions).
  subtotal / cleaningFee / total: number
  currency: 'EUR'
  // **platformFee: number** — always present, 0 until fees exist (§10). Room, not policy.

  paymentMethod: 'cash' | 'online'
  // **new set** — 'awaiting' added by PaymentsSystemDesign.md §3/§9 (open checkout, invisible row)
  paymentStatus: 'on_arrival' | 'awaiting' | 'authorized' | 'paid' | 'released' | 'refunded'
  // **paymentRef?: string** — provider hold/charge ref; absent for cash
  // **paymentDeadlineAt?: number** — 'awaiting' rows only; the reaper deletes past it (PSD §3)
  // **paymentFlag?** — a money op failed, a human finishes it (PSD §4/§6 failure pattern)

  status: pending | confirmed | checked_in | checked_out
        | declined | auto_declined | withdrawn | cancelled                        // **+ withdrawn**

  // **Policy snapshot** — the rules this booking lives under, frozen at creation:
  // policy: { freeCancelDays: number, hostResponseHours: number }

  // Stay confirmation (§11): requested by host, answered = confirmedAt >= requestedAt.
  stayConfirmationRequestedAt?: number
  stayConfirmedAt?: number

  pendingExpiresAt?: number
  cancelledAt?: number
  cancelledBy?: 'guest' | 'host' | 'system' | 'admin'                             // **+ 'admin'**
  cancelReason?: string
  lateCancellation?: boolean                                                      // **new**
  updatedAt: number
}

apartments: instantBooking: boolean already exists — no addition needed (§1)
apartmentBlocks (new):   { apartmentId, startDate, endDate } // §6, index by_apartment
```

- Indexes: keep the current set (`by_booking_code`, `by_guest`, `by_guest_status_checkin`,
  `by_host_status_checkin`, `by_status`, …) — they were designed for exactly the reads in §9.
- No `bookings` aggregate is provisioned (`GeneralSystemDesignRule.md` § how it's wired) —
  its only designed consumer, the admin dashboard, is unbuilt. Whoever provisions it will be
  defining the namespace fresh, so the status set is not a re-backfill hazard today.
- Guest access without an account stays capability-based: the booking `_id` (unguessable) is
  the token for the reservation page and guest actions; `bookingCode` is the human handle
  for email and support. Rate limiting per the existing middleware.

## 8. Notifications — every transition, every recipient

Transactional email only (the existing Resend + `src/convex/i18n` recipient-locale catalog).
No in-app notification center (§11).

| Transition                           | Guest email                                                                                  | Host email                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| request created (`pending`)          | ✅ request received + what happens next                                                      | ✅ new request + respond-by deadline                              |
| instant book (`confirmed` at create) | ✅ confirmed                                                                                 | ✅ new confirmed booking                                          |
| `confirmed` (host accepts)           | ✅ confirmed (+ payment captured, if online)                                                 | —                                                                 |
| `declined`                           | ✅ with host's reason                                                                        | —                                                                 |
| `auto_declined` (expiry)             | ✅ "host didn't respond"                                                                     | ✅ "you missed one" (nudge toward instant book or faster replies) |
| `auto_declined` (lost overlap race)  | ✅ distinct copy (§6)                                                                        | —                                                                 |
| `withdrawn`                          | —                                                                                            | ✅ polite FYI                                                     |
| `cancelled` by guest                 | ✅ receipt (+ refund status)                                                                 | ✅ dates freed                                                    |
| `cancelled` by host                  | ✅ + reason + refund status (the cancel dialog collects a mandatory reason, same as decline) | ✅ receipt of their own action                                    |
| `cancelled` by admin                 | ✅ + reason                                                                                  | ✅ + reason                                                       |
| `checked_in` / `checked_out` (cron)  | —                                                                                            | —                                                                 |

Cron transitions are silent: nobody needs an email announcing that the stay they are
physically having has begun. Host-cancellation counts per host come from analytics events
(`booking.cancelled` with `cancelledBy` property — a HAPPENED question), surfaced on
`/admin/users/[id]`; current-state counts (pending queue size, tonight's guests) are
NOW-questions and belong on a `bookings` aggregate — the NOW/HAPPENED split per
`GeneralSystemDesignRule.md` § table counts. That aggregate is not provisioned yet; the
surfaces that need it (the admin dashboard) are unbuilt, and the ones that exist read bounded
index slices instead.

## 9. Data-loading verdicts (per `GeneralSystemDesignRule.md` — decided here, not per-PR)

| Surface                                       | Verdict                                        | Justification (the rule's question)                                                                                                                   |
| --------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Booking creation form (`/book`)               | One-shot loader                                | Listing data changes only by host action elsewhere. Availability is validated in the mutation anyway — the form never needs live dates.               |
| Guest "my bookings" list                      | One-shot, streamed `+page.ts`                  | Changes arrive by email first; remount refetch is fresh enough.                                                                                       |
| Guest reservation page (`/reservations/[id]`) | **Subscription**                               | The one guest surface that moves underneath the viewer: guests sit on this page waiting for the host's confirm, and the cron can flip state mid-view. |
| Host reservations queue                       | **Subscription**                               | The rule's admin-orders example verbatim — new requests arrive from other people while the host watches, and the 48h clock makes staleness costly.    |
| Host dashboard pending strip                  | **Subscription** (shared query with the queue) | Same data, same justification.                                                                                                                        |
| Admin `/admin/bookings`                       | **Subscription** via DataTable                 | Already decided in `AdminPagesSystemDesign.md` §3.                                                                                                    |
| Counts (badges, dashboards)                   | `bookings` aggregate — **not provisioned yet** | NOW-questions (§8). Add it with the first surface that needs it (§7).                                                                                 |
| Revenue / trends                              | analytics events                               | HAPPENED-questions (§8).                                                                                                                              |

Everything else about mechanism (which loader file, streamed vs awaited, preloading) follows
the general rule's decision matrix — this document adds no exceptions to it.

## 10. Fees — deliberately not designed here

Platform monetization (listing fee vs per-booking fee, amounts, who pays) is a **listing
concern, not a booking-system concern** — since the 2026-07-31 revision each listing
carries its host-chosen model. The booking system's only obligations, met by §7:

- `platformFee` exists in the price snapshot (0 today) so historical bookings stay honest
  when fees switch on.
- Price composition happens in one shared function (the existing `calculatePrice` seam), so
  the fee line is one change in one place, keyed off the listing's `monetization` field.

Everything else — the per-listing model choice, rates, collectability — is owned by
`AccommodationsSystemDesign.md` §8: `booking_fee` listings are online-only by construction
(that is what makes the fee collectable), `listing_fee` listings carry no per-booking fee.

## 11. Considered and rejected (or deferred)

- **Booking alterations (change dates/guests)** — rejected for v1. Cancel-and-rebook covers
  it with zero new states; the free-cancel window makes it costless when it matters most.
  An "alter" flow is a second state machine (proposals, counter-offers, price deltas,
  re-authorization) grafted onto the first. Revisit only on real user demand.
- **Host cancellation of `checked_in` stays** — rejected. Ejecting a present guest is a
  physical-world event with legal texture; the admin brake exists for the rare real case.
- **Tiered cancellation policies per listing** — deferred (§4). The snapshot makes it a
  cheap later change; one number is the right start.
- **In-product stay confirmation ("confirm your stay")** — **BUILT** (pulled forward from
  its trigger by explicit decision). Host action "ask the guest to confirm" →
  `stayConfirmationRequestedAt` stamped (re-requests overwrite, cooldown
  `STAY_CONFIRMATION_COOLDOWN_HOURS` = 48h) → guest gets an email + a one-click confirm on
  the live reservation page → `stayConfirmedAt` stamped, host gets the closing FYI.
  Answered = `confirmedAt >= requestedAt`, so a re-request re-asks the question. The
  cash-inside-window host cancel requires a request pending unanswered ≥
  `STAY_CONFIRMATION_UNLOCK_HOURS` (24h) — "unresponsive" is a fact the guard checks
  (`stayConfirmationUnlocksCancel`), not a claim. Unlock hours are operational mechanics,
  read live — deliberately NOT in the policy snapshot. Requests are allowed on any
  confirmed booking (verification is normal host behaviour); the unlock only matters for
  cash — an ignored request never unlocks an online cancel, money already proves intent.
- **No-show reporting** — deferred. It's a flag with no automated consequence until there's
  an account-standing system to feed; today the host's day-of cancel plus `lateCancellation`
  flags carry the signal. Design it with reviews/reputation, not before.
- **Security deposits** — rejected for cash (uncollectable) and deferred for online
  (provider-dependent hold mechanics; belongs with the payment adapter work).
- **In-app notification center / push** — rejected. Email is the channel both sides already
  check; a notification table + read-state + realtime badge is a standing subscription cost
  (`GeneralSystemDesignRule.md` § cost model) for a duplicate of the inbox.
- **"Mark cash as paid" for hosts** — rejected (§5): unverifiable data entry that would make
  `paymentStatus` mean two different things depending on method.
- **Multi-currency** — rejected. `currency: 'EUR'` literal stays until the business operates
  in a second currency, which is a pricing-model event, not a schema toggle.
- **Retry/saga infrastructure for payment failures** — rejected (§5): every failure path
  resolves to "the mutation fails whole and a human is told". Human-scale volumes.

## 12. Delta from the current implementation

What the re-implementing LLM actually has to touch — everything not listed is already
correct and stays:

1. **Schema**: add `withdrawn` status; new `paymentStatus` value set (migrate `pending` →
   `on_arrival` for cash / `authorized` for online, `paid`/`refunded` map 1:1); add
   `platformFee` (0), `policy` snapshot, `lateCancellation`, `paymentRef?`, `cancelledBy:
'admin'`; make `apartmentId` required; new
   `apartmentBlocks` table. Then the aggregate re-backfill ritual.
2. **`withdrawBookingGuest`**: set status `withdrawn` (today it reuses the cancel path).
3. **`cancelBookingGuest` / `cancelBookingOwner`**: enforce the §4 windows per payment
   method — guest: cash closes at the free-cancel cutoff, online open until the day before
   check-in but non-refundable inside it (`lateCancellation` from the policy snapshot);
   host: cash open until check-in (verification norm), online closed inside the cutoff.
4. **`confirmBooking`**: add the availability re-check + overlap auto-decline (§6) — today
   confirm trusts the create-time check.
5. **Cron**: compute "today" in `PROPERTY_TIMEZONE` (§3); on auto-decline of online
   bookings, release the hold via the adapter.
6. **`createBooking`**: instant-book branch; policy snapshot stamping; `apartmentBlocks` in
   the availability check.
7. **Admin cancel**: stamp `cancelledBy: 'admin'` (today it likely reuses another value).
8. **New**: `apartmentBlocks` CRUD for hosts (tiny — three mutations, one query, calendar
   UI on the host side); payment adapter skeleton with the three-operation interface (§5),
   unwired until a provider is chosen.
9. **Config**: `BOOKING_POLICY` gains `PROPERTY_TIMEZONE`; everything else already lives
   there (`src/shared/features/booking/config.ts`).

Order of implementation: 1 → 2/3/7 (pure policy, no new surface) → 4/6 (correctness) →
5 (timezone) → 8 (new surface). Each step independently shippable; payment adapter last and
only when a provider is picked.

## § FOR LLMs / AI ASSISTANTS — READ BEFORE TOUCHING BOOKING CODE

1. **Never add a manual state-advance action.** `checked_in`/`checked_out` are cron-only
   (I1). If a UI seems to need a button for them, the UI is wrong.
2. **Every transition mutation follows I2–I4**: evidence fields in the same patch, one
   transaction, trigger-wrapped constructors, analytics + email after the patch.
3. **Transition guards are shared pure functions (I5)** in
   `src/shared/features/booking/utils/` — extend the existing `guestMayPerform` /
   `hostMayPerform` pattern. Never write a permission check inline in a mutation or a
   `{#if}` that isn't calling the shared guard.
4. **Read policy from the booking's snapshot, not from live config**, for any decision about
   an existing booking. Live config is for creating new bookings only.
5. **Cash has no money mechanics.** If you're writing refund/charge logic in a
   `paymentMethod: 'cash'` branch, stop — the design says the platform never touches cash.
6. **Availability = `confirmed` + `checked_in` + `apartmentBlocks`, checked inside the
   deciding mutation.** Never trust a check done at render time or in a previous mutation.
7. **Statuses are closed.** Eight statuses, five terminal. A new requirement that seems to
   need a ninth status almost certainly needs a discriminator field on an existing one —
   or is out of scope (§11).
8. **When uncertain, say so in your summary** with the section number, e.g. "allowed late
   cancel per BookingSystemDesign.md §4; say the word if this listing class should differ."
