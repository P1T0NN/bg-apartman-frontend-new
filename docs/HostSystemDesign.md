# Host System — System Design

> Status: **target design** (written 2026-07-27). The host-facing half of the platform —
> who a host is, the host area, the reservations queue, the availability calendar, and
> where money surfaces — as it SHOULD be. §10 lists the exact delta from current code;
> everything not listed is already correct and stays.
>
> Like `GuestSystemDesign.md`, this document owns **no lifecycle and no money mechanics**:
> booking transitions belong to `BookingSystemDesign.md`, listing states and monetization
> to `AccommodationsSystemDesign.md`, payment/payout flows to `PaymentsSystemDesign.md`,
> operator surfaces to `AdminPagesSystemDesign.md`, data rules to
> `GeneralSystemDesignRule.md`. This document owns what the HOST experiences — and it
> exists chiefly to design the three host surfaces the other documents name but don't
> draw: the availability calendar (§4), the queue's handling of the new states (§3), and
> the earnings card's home (§5). Where a cited document decides something, it wins.

## 0. Operating principles

1. **A host is a user with a listing — not a role, not an application.** There is no host
   approval step and no host account type: moderation gates _listings_
   (`AccommodationsSystemDesign.md` §1), never people. "Become a host" is a door, not a
   form.
2. **The host's job on this platform is answering requests and keeping the calendar
   true.** Every host surface is ranked by that: what needs a decision now → what is
   happening today → how the business is doing. Decoration never outranks the queue.
3. **The platform never nags.** One queue, one persistent earnings card (when relevant),
   deadline chips that state facts. No modals demanding attention, no red-dot anxiety
   machinery. The 48h clock (`BookingSystemDesign.md` §1) is pressure enough — the UI's
   job is to make it visible, not louder.
4. **Hosts act through the same shared guards the backend enforces**
   (`BookingSystemDesign.md` I5 — `hostMayPerform`). A host never sees a button that will
   be rejected; a rejection means the state moved, and the live queue already shows it.

## 1. Becoming a host

- Any signed-in user reaches `/host/**` via "Become a host" / "Switch to hosting"
  (existing sidebar CTA). `isHost` stays a derivation — owns ≥ 1 listing (existing
  `getCurrentUser` read) — never a stored role to migrate.
- A visitor to `/host/**` with **zero listings** gets the become-host state: one screen,
  one CTA → `/host/add-accommodation`. No tour, no checklist — the add-listing form (with
  its client-side draft persistence, `AccommodationsSystemDesign.md` §12) IS the
  onboarding.
- **Nothing financial at this point, ever** — `PaymentsSystemDesign.md` §2 stage 0/1 is
  binding here: the words "payout", "bank", or "billing" do not appear anywhere in the
  become-host or add-listing flows.

## 2. The host area — map and ranking

Sidebar (existing structure, two additions):

```
Overview        Dashboard, Reservations
Accommodations  My Accommodations, Add Accommodation
                (Calendar is per-listing — entered from My Accommodations rows, §4 —
                 deliberately NOT a sidebar item: a multi-listing host has no single calendar)
Analytics       Analytics (§2b — read-only, no badge)
navSecondary    Switch to traveling (+ Admin Page, admins only)
```

| Page                      | One question it answers                        | Verdict (per `GeneralSystemDesignRule.md`)                                                                                            |
| ------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/host/dashboard`         | "What needs me, what's today, how's business?" | Composed page query, streamed one-shot — EXCEPT the pending strip, which shares the queue's live query (`BookingSystemDesign.md` §9). |
| `/host/reservations`      | "Answer requests; manage stays"                | **Subscription** — the rule's admin-orders example verbatim (decided in `BookingSystemDesign.md` §9).                                 |
| `/host/my-accommodations` | "My listings and their states"                 | **Subscription** — admin moderation and the listing-fee cron move rows under the viewer (`AccommodationsSystemDesign.md` §9).         |
| Add / edit accommodation  | authoring                                      | Awaited loader, Pattern B dirty-state (`AccommodationsSystemDesign.md` §9).                                                           |
| Per-listing calendar (§4) | "When is this place actually free?"            | **Subscription** — bookings land from other people while the host edits blocks, and the same screen both displays and mutates.        |
| `/host/analytics` (§2b)   | "How's business, really?"                      | **One-shot** — month-scale aggregates don't move under a viewer; a remount is fresh enough.                                           |

Dashboard band order (existing components, re-ranked by §0.2): **1)** pending-requests
strip with deadline chips (absent when empty — Band-1 convention), **2)** earnings/payout
card when it has something to say (§5), **3)** today (check-ins/check-outs), **4)** stat
tiles. Bands 1–2 are the job; 3–4 are the weather.

> Design revision (2026-07-29): the revenue chart and per-listing performance table left
> the dashboard for their own page, `/host/analytics` (§2b). The dashboard's answer to
> "how's business?" is the occupancy/revenue tiles, which stay; depth is one click away.

**Dashboard reads must not scale with portfolio size.** Hosts here are not one-apartment
individuals — a sizeable minority own 100+ listings, and the dashboard is the page they land
on, so it is the one surface where a per-listing cost is unaffordable. `fetchHostDashboardStats`
is therefore built entirely from O(log n) reads: listing counts from `aggregateApartments`
bounded to the host, held earnings from `aggregateHostEarnings`, and revenue AND occupancy
from two months of host-scoped rollups. The only table read left is a seven-day forward slice
for upcoming check-ins, plus the today strip (capped at one day). Occupancy specifically is an
event ledger — `booking.nights_booked` minus `booking.nights_released`, pre-split per calendar
month at confirm time — because a month-clipped night count cannot be an aggregate; see
`GeneralSystemDesignRule.md` § when a NOW-question has to become a HAPPENED-question for the
obligation that creates.

## 2b. `/host/analytics` — performance & trends

**Question: "How's business, really?"**

The host's performance deep-dive — a page a host opens on purpose, which is exactly why it
left the dashboard: the trend chart and the cross-listing table are the heaviest host
reads, and on the dashboard they ran on every visit whether or not the host cared that day.

Two zones, one page:

1. **Trend chart** — trailing 12 months, revenue/bookings toggle, host-scoped (the same
   rollup metrics the admin GMV numbers use, read WITH the host's analytics scope). Reuses
   the `layerchart` composition via the shared `chart-container` — keep the rAF-defer.
2. **Per-listing table** — each `published` listing's current-month occupancy %, revenue,
   and next check-in, best occupancy first ("which of my places is carrying me"). No
   "at least two listings" gate here, unlike the old dashboard table: on a page opened to
   study performance, one row is still the answer. Titles link to the listing's EDIT page —
   the host's next move after a weak row is changing price or photos.

Data: one query, `fetchHostAnalyticsSafe` — the series from host-scoped pre-aggregated
rollups (HAPPENED-questions, `GeneralSystemDesignRule.md` § table counts), the table from
index-bounded `by_host_status_checkin` slices clipped to the month via `nightsWithinWindow`.
**One-shot** (see the §2 table): no live channel, so these reads run only when the page is
actually opened.

Note the deliberate asymmetry with §2: this page still scans bookings, where the dashboard no
longer does. That is not an oversight. The occupancy ledger is host-scoped, so it cannot
answer "which of my places is carrying me" — a PER-LISTING breakdown needs per-listing data.
Given a 100+-listing host this page is the expensive one, and it is allowed to be: it is
opened on purpose, one-shot, and its whole reason to exist is the per-listing split. If it
ever needs to stop scanning, the move is an `apartmentId` breakdown property on
`booking.nights_booked` (`.by('apartmentId')`), not a second table. States: skeletons → error card → a one-line "numbers appear with your
first confirmed booking" empty — never an empty chart frame.

## 3. The reservations queue — complete state handling

Single surface (existing `fetchHostBookingsSafe` table), status-filterable, default filter
**Pending** (the actionable slice). Row → expand in place; guest contact details visible
from `confirmed` onward (before confirmation the guest is an applicant, not a contact).

### Actions (all via `hostMayPerform` — §0.4)

| Booking state       | Host actions                                                                                                      | Dialog copy must state (the consequence, concretely)                                                                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pending`           | **Confirm**                                                                                                       | Cash: "The guest will be notified by email." Online: "The guest's card will be charged now, and they'll be notified." (capture-at-confirm — `PaymentsSystemDesign.md` §3).                                                                                 |
| `pending`           | **Decline**                                                                                                       | Reason required (guest reads it — existing schema). "The guest will see this explanation."                                                                                                                                                                 |
| `confirmed`, cash   | **Cancel** (outside the window: free; inside: unlocks only after a stay-confirmation request sits unanswered 24h) | Reason required, same as decline (the guest reads it — `BookingSystemDesign.md` §8). "Ask guest to confirm" panel in the detail sheet drives the unlock — request → wait → cancel opens, or guest confirms and it re-locks (`BookingSystemDesign.md` §11). |
| `confirmed`, online | **Cancel** (only ≥ `FREE_CANCEL_DAYS` out)                                                                        | Reason required, same as decline. "The guest gets a full refund and both of you are emailed. Repeated cancellations are reviewed." Inside the window the button is gone and the sheet says why — the paid stay is ironclad (`BookingSystemDesign.md` §4).  |
| `checked_in`+       | —                                                                                                                 | No actions (admin brake only). The row shows support contact instead of buttons — never a dead end.                                                                                                                                                        |

**The verification norm, surfaced:** from `confirmed` onward the queue exposes the guest's
phone and email precisely so the host can check in on the stay at any time — WhatsApp or
email — especially for cash bookings (`BookingSystemDesign.md` §4). An unresponsive cash
guest is the sanctioned reason for the cancel action above.

### The new states, handled explicitly (the gap this section closes)

- **`withdrawn`** rows are informational: muted row, "guest withdrew", no action, no
  badge count — a withdrawn request must not read as a loss or demand attention
  (`BookingSystemDesign.md` §2: it's a non-event).
- **`auto_declined`** rows carry which variant (expired vs lost-overlap-race,
  `BookingSystemDesign.md` §6) — a host reviewing their misses should see "you didn't
  respond in time" as distinct from "you confirmed someone else".
- **Confirm fails on capture** (`PaymentsSystemDesign.md` §3): the queue surfaces the
  mutation's error as "Payment failed — the request stays open; ask the guest to rebook."
  The row stays `pending`; no synthetic state is invented for it.
- **`awaiting` bookings never appear** — they don't exist to the host by design
  (`PaymentsSystemDesign.md` §3: no emails, no clock, no queue entry).
- **Deadline chips** (existing `getPendingExpiryChip`) stay fact-shaped ("expires in 6h"),
  and the queue's default sort is deadline-ascending — the request closest to dying is
  row one.

## 4. The availability calendar — `apartmentBlocks` gets its UX

The one genuinely new host surface. `BookingSystemDesign.md` §6 created the table (blocks
are rows, never fake bookings); this section is its interface.

- **Entry**: "Calendar" action on each `my-accommodations` row →
  `/host/my-accommodations/[id]/calendar`. Per listing — no merged multi-listing view
  (§2 sidebar note).
- **One month-grid view** (reuse the existing availability-calendar component family),
  showing three things and only three: **booked nights** (confirmed/checked_in — read-only
  cells linking to the reservation row in the queue), **blocked nights** (host's own), and
  **free nights**. Pending requests do NOT paint the calendar — they block nothing
  (`BookingSystemDesign.md` §6) and painting them would teach hosts the wrong model.
- **Interaction is one gesture**: select a free range → "Block these nights"; select a
  blocked range → "Unblock". No forms, no titles, no colors to pick — a block has no
  metadata because it answers exactly one question (free or not). A host who wants "why
  did I block this" writes it in their own notes app; we are not building a scheduler.
- **Server rules** (the three mutations + one query from `BookingSystemDesign.md` §12.8):
  - Night convention **identical to bookings'** overlap check (a block spanning
    `start..end` blocks the same nights a booking with those dates would) — one shared
    range utility, zero off-by-one class.
  - Creating a block that overlaps a **booked** night is rejected — blocking doesn't
    cancel; the dialog says "these dates have a confirmed stay."
  - Blocks vs **pending** requests: allowed (requests block nothing); the request then
    dies at confirm via the availability re-check, standard lost-race email. The calendar
    is the host's truth — a block is how a host says no to dates without answering each
    request.
  - Sanity caps: max range per block (e.g. 1 year), blocks only in the future-or-today.
- **"Vacation mode" is this feature**: block the range. Not a listing status, not a
  toggle — archive exists for "gone indefinitely" (`AccommodationsSystemDesign.md` §4).

## 5. Money on the host side — surfaces only

All mechanics are `PaymentsSystemDesign.md`; the host UI is exactly three artifacts:

1. **The earnings/payout card** (dashboard band 2) — the stage machine's one UI
   (`PaymentsSystemDesign.md` §2): hidden until first capture; then "€{held} held for you
   — add payout details (~3 min)" with the provider-hosted onboarding link; after
   transfers activate, a quiet summary ("€{held} pending · €{total} paid out") linking to
   a simple earnings list (ledger rows, `bookingEarnings` — held/transferred/returned in
   host words). Never a modal, never dismiss-nagging (§0.3).
2. **Billing surfaces** (since the 2026-07-31 revision the model is the host's
   per-listing choice, made in the create wizard's FINAL "Payments & plan" step, paired
   with the guest payment method — `AccommodationsSystemDesign.md` §8):
   billing state lives on `my-accommodations` rows, not on the dashboard — billing is per
   listing. `listing_fee` rows: pay button while unpaid (the first payment gates going
   live), expiry date + renew button thereafter, and the one-way "Change plan" action.
   `booking_fee` rows: no action — visible text instead, "Per-booking fee (10%) —
   permanent · new listing to change plan" (`AccommodationsSystemDesign.md` §8's one-way
   door, stated where a host would go looking for the switch).
3. **Per-booking payment line** in the queue rows: cash → "collect €X at the property";
   online → the guest-agnostic host words ("held — charges on confirm", "paid",
   "refunded"). Same decoupling rule as everywhere: stay status and money status render
   as two facts, never merged.

## 6. Notifications — host inbox rules

The transition tables live in `BookingSystemDesign.md` §8 and
`AccommodationsSystemDesign.md` §10 — no third copy here. Host-side rules on top:

- Every host email's primary action deep-links to the **reservations queue filtered to the
  booking** (or the listing row for listing emails) — one click from inbox to the button.
- The new-request email states the deadline datetime, not "48 hours" — the fact the host
  must plan around, phrased as the moment it expires.
- The auto-decline "you missed one" email nudges toward instant book (the designed
  response to a host who can't keep the SLA — `BookingSystemDesign.md` §8), exactly once
  per event, no follow-up drip.

## 7. Cross-document consistency map

| Consumed decision                                       | Source                                                       | Host-side dependency                                          |
| ------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| 48h window, capture-at-confirm, full-refund host cancel | `BookingSystemDesign.md` §1/§4, `PaymentsSystemDesign.md` §3 | §3 dialog copy                                                |
| `withdrawn` / `auto_declined` variants / no `awaiting`  | `BookingSystemDesign.md` §2/§6, `PaymentsSystemDesign.md` §3 | §3 state handling                                             |
| Shared guards (`hostMayPerform`)                        | `BookingSystemDesign.md` I5                                  | §0.4, §3 buttons                                              |
| Blocks table, night convention, pending-vs-block        | `BookingSystemDesign.md` §6                                  | §4 — the UX of that decision                                  |
| Listing states, edit rules, fee lifecycle               | `AccommodationsSystemDesign.md`                              | §2 my-accommodations, §5.2 renewal surfaces                   |
| Onboarding stages + copy discipline                     | `PaymentsSystemDesign.md` §2                                 | §1 (no money words), §5.1 (the card is stage 3–4's home)      |
| Host-cancellation counts for admin                      | `BookingSystemDesign.md` §8                                  | §3 cancel dialog's "reviewed" sentence — true because tracked |

## 8. Defined behaviors (the no-surprises ledger)

| Situation                                                 | Defined behavior                                                                                                                                                                            |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User with zero listings opens `/host/**`                  | Become-host state (§1) — never an empty dashboard.                                                                                                                                          |
| Two pending requests overlap; host confirms one           | Second auto-declines in the same mutation, distinct email (`BookingSystemDesign.md` §6); queue (live) shows both results instantly.                                                         |
| Host tries to confirm after the listing expired/suspended | Confirm fails (A1 re-check); queue error says renew/contact support — the intended pressure (`AccommodationsSystemDesign.md` §8).                                                           |
| Host edits price with requests pending                    | Requests keep their requested price; confirming = accepting it (`AccommodationsSystemDesign.md` §5). The queue row shows the request's own total.                                           |
| Host archives a listing with pending requests             | Requests die at confirm/expiry, standard emails; the archive dialog says so.                                                                                                                |
| Host blocks dates that have a pending request             | Allowed; request dies at confirm via re-check (§4). The block dialog does NOT enumerate affected requests — the calendar is not a decline UI.                                               |
| Host misses the 48h window repeatedly                     | Auto-declines + nudge emails; no automated penalty — visibility (admin host view) is the lever, same as host cancellations.                                                                 |
| Guest withdraws while host is mid-confirm                 | Confirm rejects (guard re-check); live queue already shows `withdrawn` (§3).                                                                                                                |
| Host with many listings                                   | Same surfaces; queue and dashboard are host-scoped not listing-scoped; calendar stays per-listing (§4).                                                                                     |
| Host deletes their account                                | Admin-mediated flow surfaces listings first (`AccommodationsSystemDesign.md` §11); held earnings follow the payout rules — money is never orphaned silently (`PaymentsSystemDesign.md` §5). |
| `isSuperhost` display                                     | Denormalized read (`AccommodationsSystemDesign.md` §7); how it's _earned_ is deferred with the reputation cluster — until then it's an admin-set flag, shown, never explained as automatic. |

## 9. Considered and rejected (or deferred)

- **Host application / vetting step** — rejected (§0.1): listing moderation already
  gates quality where it matters, per artifact not per person.
- **Merged multi-listing calendar** — rejected for v1: real value only for portfolio
  hosts, real complexity now; per-listing covers the platform's actual scale.
- **Per-date custom pricing (seasonal calendar pricing)** — deferred: `weekendPremium` +
  discounts cover today's pricing shapes; a price-per-night calendar is a large surface
  awaiting real host demand. The calendar (§4) deliberately does NOT get price editing so
  it stays one-question simple.
- **Auto-accept rules ("accept if ≥3 nights")** — rejected: that's instant book with
  extra steps; the flag exists (`AccommodationsSystemDesign.md` §6).
- **iCal / channel sync** — already deferred (`AccommodationsSystemDesign.md` §12); noted
  here because §4's calendar is where it would land, and its absence is why the block
  tool must stay effortless.
- **Host teams / co-hosts** — rejected: one owner per listing; sharing an account is the
  workaround this scale deserves.
- **In-app host↔guest messaging** — rejected on the guest side
  (`GuestSystemDesign.md` §10); symmetrically here.
- **Push notifications / notification center** — rejected platform-wide
  (`BookingSystemDesign.md` §11); email + the live queue are the channels.

## 10. Delta from the current implementation

1. **The calendar** (§4) — the only new build: route + month grid on the existing
   calendar components, three block mutations + one query (with the shared night-range
   utility), booked-night links into the queue. Ships with/after `apartmentBlocks`
   lands (`BookingSystemDesign.md` §12.1/12.8).
2. **Queue state audit** (§3): `withdrawn`/`auto_declined`-variant rendering,
   capture-failure error surface, default Pending filter + deadline-ascending sort,
   contact-details gating. Ships with the booking re-implementation pass.
3. **Earnings/payout card** (§5.1) — ships with `PaymentsSystemDesign.md` §13.5 (stage
   machinery), dark until `PROVIDER` flips.
4. **Dashboard band re-rank** (§2) — pending strip and earnings card above today/stats;
   small component reorder.
5. **Become-host empty state** (§1) for zero-listing visitors.
6. **Confirm/decline/cancel dialog copy** per §3's table (consequence sentences,
   payment-aware confirm).

Order: 2 → 6 → 4 → 5 (all inside the booking pass) → 1 (after blocks exist) → 3 (with
payments). Nothing here blocks any other document's delta.

## § FOR LLMs / AI ASSISTANTS — READ BEFORE TOUCHING HOST-FACING CODE

1. **No financial asks outside the §5.1 card** — the stage table in
   `PaymentsSystemDesign.md` §2 is the complete list; host flows never grow a "set up
   payouts" gate, modal, or checklist item.
2. **Buttons through `hostMayPerform`, copy through the §3 table** — no inline status
   checks, no dialog that omits the consequence (who's emailed, who's charged, who's
   refunded).
3. **The calendar answers one question** (§4): free or not. No pricing, no request
   management, no metadata on blocks — resist every enrichment; each one is listed in §9
   with its rejection.
4. **Pending paints nothing** — neither the calendar nor availability; requests block
   nothing until confirmed (`BookingSystemDesign.md` §6). If a host surface implies
   otherwise, it's teaching the wrong model.
5. **`awaiting` doesn't exist here** — if host-side code branches on it, the invisibility
   rule (`PaymentsSystemDesign.md` §3) is being violated.
6. **Live surfaces are the decided three** (queue, my-accommodations, calendar — §2);
   everything else streams one-shot. New subscriptions need the general rule's written
   justification.
7. **When uncertain, say so in your summary** with the section, e.g. "kept blocks
   metadata-free per HostSystemDesign.md §4; say the word if hosts need block labels."
