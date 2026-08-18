# Accommodations System — System Design

> Status: **target design** (written 2026-07-27). The listings system as it SHOULD be — the
> spec for a re-implementation pass, not documentation of the current code. §13 lists the
> exact delta from what exists; everything not listed there is already correct and stays.
> Companions: `GeneralSystemDesignRule.md` (data rules — cited, never restated),
> `BookingSystemDesign.md` (the consumer of listings — cross-referenced where the two meet),
> `AdminPagesSystemDesign.md` (the moderation UI surface).
>
> This document also owns **platform monetization** (§8) — the per-listing listing-fee vs
> booking-fee choice — because a monetization model is a property of how a listing exists on
> the platform, and the config seam lives here. `BookingSystemDesign.md` §10 defers to this
> section.

## 0. Operating principles

1. **A listing is a host's asset under platform moderation.** Hosts author; admins gate
   what's public; neither does the other's job. No admin content editing, no host
   self-publishing.
2. **Search only ever sees `published`.** Every other status is a private state between the
   host, the admin, and the machine. There is exactly one bookable status, so "can this be
   booked?" is one equality check, everywhere.
3. **Listings are referenced forever; listings are editable now.** Bookings snapshot what
   they need at creation (price, policy — `BookingSystemDesign.md` §7). Therefore listing
   edits are always safe for existing bookings, and the system never needs edit-locking,
   versioning, or "this listing changed since you booked" reconciliation.
4. **Monetization is a per-listing choice under a platform switch, not a rewrite.** The
   platform switch (`MONETIZATION: 'none' | 'per_listing'`) decides whether monetization
   exists at all; when it does, **each listing carries its own model** — the host chose it
   (§8). Every model's hooks exist in the schema permanently; flipping the switch changes
   behavior, never structure. (Revised 2026-07-31 from the original one-global-mode design —
   this is the "hybrid earns its own design revision" §12 used to promise.)

## 1. The state machine

### States

```
                      host submits
   (create) ────────────────────────► ┌────────────────┐
                                      │ pending_review │ ◄─── host resubmits (from archived/suspended-fixed? no — see rules)
                                      └───────┬────────┘
                              admin           │            admin
                    ┌─────────────────────────┼──────────────────┐
                    ▼                                            ▼
              ┌───────────┐         admin (reason req.)    ┌───────────┐
              │ published │ ─────────────────────────────► │ suspended │
              └─────┬─────┘ ◄───────────────────────────── └─────┬─────┘
                    │              admin re-publishes            │
     cron           │                                            │
 (listing-fee listings) ▼                                        │ host archives
              ┌───────────┐        host renews (skips review)    │
              │  expired  │ ───────────────► published           │
              └─────┬─────┘                                      │
                    │ host archives                              │
                    ▼              host resubmits                ▼
              ┌──────────┐  ─────────────────────────►  pending_review
              │ archived │
              └──────────┘
```

Five statuses: `pending_review`, `published`, `suspended`, `expired`, `archived`.

| Status           | Meaning                                     | Visible in search / bookable | Who sets it                                      |
| ---------------- | ------------------------------------------- | ---------------------------- | ------------------------------------------------ |
| `pending_review` | Born here; awaiting moderation              | ❌                           | `createAccommodation` (hardcoded); host resubmit |
| `published`      | Live                                        | ✅ (the only one)            | Admin only (`moderateApartmentStatus`)           |
| `suspended`      | Admin pulled it; reason required            | ❌                           | Admin only                                       |
| `expired`        | Listing fee lapsed (`listing_fee` listings) | ❌                           | **Cron only** — never a human                    |
| `archived`       | Host shelved it                             | ❌                           | Host (own listing), admin                        |

### Transition rules (the complete set — anything not listed is forbidden)

- **Host**: create → `pending_review`; any own listing → `archived`; `archived` →
  `pending_review` (resubmit, full re-review — content may have rotted while shelved);
  `expired` → `published` **directly on successful renewal** (content was already approved;
  paying again is not a content event).
- **Admin**: `pending_review` → `published` | `suspended`; `published` ⇄ `suspended`
  (suspension requires a reason — it reaches the host's email); anything → `archived`
  (tidy-up). Admin never sets `expired` and never edits content (§2).
- **Cron**: `published` → `expired` for `listing_fee` **listings** only (§8). The only
  machine transition in this system.
- **`suspended` is admin-owned in AND out.** A host cannot resubmit a suspended listing —
  suspension is a conversation with the platform, not a queue to re-enter. The host fixes
  the issue, replies to the suspension email, and the admin re-publishes. (Archiving it
  remains the host's exit.)
- **Nothing is terminal.** Unlike bookings, a listing is an asset, not an event — every
  state has a road back. The closest thing to terminal is deletion (§4).

### Invariants

- **A1** — `status === 'published'` is the single bookability predicate. `createBooking`
  AND `confirmBooking` both check it (the confirm-time re-check catches listings suspended
  or expired while a request sat pending — same shape as the availability re-check in
  `BookingSystemDesign.md` §6).
- **A2** — Every admin status write stamps `moderatedAt/moderatedBy/moderationReason` and
  audit-logs; every cron write stamps a machine-readable cause (§8). No status change
  without evidence.
- **A3** — Status changes never touch content fields and content edits never touch status
  (one exception: resubmit, which is a status-only action the host triggers explicitly).
- **A4** — All apartment writes go through `@/convex/functions` constructors
  (`GeneralSystemDesignRule.md` § table counts — `counters.apartments` namespace = status).

## 2. Editing — and why edits don't re-trigger review

Hosts edit freely at any status; **edits never change status**. A published listing stays
published through an edit.

Why this is safe enough, in order:

1. Bookings are snapshot-isolated (§0.3) — no edit can corrupt money or dates in flight.
2. The moderation lever (suspend, reason, email) already covers post-approval abuse, and
   the Belgrade-scale operator team can actually use it.
3. The alternative — re-queueing every edit — punishes the 99% case (typo fixes, price
   updates, photo swaps) with downtime to catch a 1% case suspension already handles.

Two hard exceptions, enforced in the update mutation:

- **`slug` is immutable after creation.** URLs, bookmarks, emails, and bookings reference
  it (§4). A title edit does not regenerate the slug.
- **`status`, moderation stamps, and monetization fields are not in the edit surface** —
  the update mutation's arg validator simply doesn't accept them (A3). Changing the
  monetization model has its own mutation with its own rules (§8 "Switching models").

Admins do not edit listing content, ever — moderation and authorship stay separated
(`AdminPagesSystemDesign.md` §2). The one narrow exception that exists today (admin editing
_on behalf_ through the host flow) is an impersonation convenience, not an admin power.

## 3. Media — images pipeline

- Storage: Cloudflare R2 (`FEATURES.USE_R2`), public URLs stored on the row at write time
  (never mint presigned URLs on read). `images[0]` is the cover; `order` is display order.
- **Limits live in `ACCOMMODATIONS_CONFIG` (§8) and are enforced in the mutation**, not
  just the UI: `MIN_IMAGES: 3` (a listing with fewer photos cannot be submitted — guests
  won't book what they can't see), `MAX_IMAGES: 20`, size/type limits enforced at the
  upload endpoint.
- Edit reconciliation: the update mutation receives `keepImageKeys` (ordered) + new upload
  keys; anything on the row but absent from the keep-list is deleted from R2 in the same
  mutation. The orphan cron remains the safety net for uploads that never reached a save.
- Deleting a listing deletes its R2 objects (existing `deleteApartmentImages` path).

## 4. Identity, slugs, and deletion

- **Slug**: generated once at creation from the title, uniqueness enforced via `by_slug`
  (collision → suffix). Immutable thereafter (§2). It is the public identity — routes,
  emails, and `bookings.apartmentSlug` all carry it.
- **Deletion is real and rare.** Allowed only when the listing has **no active bookings**
  (`pending`, `confirmed`, `checked_in` — the existing check). Historical (terminal)
  bookings do NOT block deletion: booking rows survive on their own stored data
  (`apartmentSlug`, price snapshot) and readers already fall back when
  `ctx.db.get(apartmentId)` returns null (`resolveApartmentSummary`). A deleted listing's
  bookings render with the slug-derived title and no link — acceptable for terminal
  history, and the reason deletion never cascades into `bookings`.
- **Archive is the soft delete.** The UI leads with archive; delete sits behind it for
  hosts who genuinely want out. Support answers "where did my listing go" with the status
  history, not a shrug.

## 5. Pricing model

All amounts whole euros (`currency: 'EUR'` literal — multi-currency stays rejected,
`BookingSystemDesign.md` §11).

- Components on the listing: `pricePerNight` (base), `weekendPremium` (Fri/Sat nightly
  override), `discountAmount` (promotional nightly price — when set, UI crosses out base),
  `weeklyDiscount` (7+ night percentage), `cleaningFee` (per stay).
- **One composer.** The effective-price resolution (which nightly rate applies per night,
  then stay-length discount, then cleaning fee, then `platformFee` when §8 says so) lives
  in the shared `calculatePrice` seam — the SAME function quotes the UI and prices the
  booking mutation. If the quote and the charge can disagree, the bug is that a second
  composer exists.
- **Price edits are always safe**: bookings snapshot `subtotal/cleaningFee/platformFee/
total` at creation (§0.3). A pending request is priced at request time and that price is
  what confirm captures — the host confirming is accepting the requested price, so an edit
  between request and confirm does not reprice the request.

## 6. Booking-rules surface (owned here, consumed by the booking system)

The listing carries every knob the booking flow reads. Decisions about what the knobs _do_
live in `BookingSystemDesign.md`; this section fixes what exists and its defaults:

| Field                                                                                  | Default                                         | Notes                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `instantBooking: boolean`                                                              | `false`                                         | This IS `BookingSystemDesign.md` §1's mode flag — `false` = request-to-book, `true` = instant. One boolean, no enum rename.                                                                                          |
| `paymentMethod: 'cash'\|'online'\|'both'`                                              | `'cash'`                                        | `'online'`/`'both'` are selectable only when the payments adapter exists (`PaymentsSystemDesign.md` §8 — `PROVIDER` gate) — the form disables them until then. A `booking_fee` listing is locked to `'online'` (§8). |
| `minReservationDays` / `maxReservationDays`                                            | 1 / none                                        | Enforced in `createBooking`, displayed on the calendar.                                                                                                                                                              |
| `sameDayReservation`                                                                   | `false`                                         | May a stay start today.                                                                                                                                                                                              |
| `singleDayReservation`                                                                 | `false`                                         | Check-in and check-out on the same date.                                                                                                                                                                             |
| `checkInTime` / `checkOutTime`                                                         | 14:00 / 10:00                                   | Display copy only — never state (`BookingSystemDesign.md` §3).                                                                                                                                                       |
| `quietHoursStart/End`, `petsAllowed`, `smokingAllowed`, `partiesAllowed`, `houseRules` | —                                               | Policy display; no enforcement machinery.                                                                                                                                                                            |
| `timeZone`                                                                             | resolved from pin; fallback `DEFAULT_TIME_ZONE` | The availability calendar runs in the listing's zone, not the viewer's.                                                                                                                                              |

## 7. Search & discovery

- **Predicate: `status === 'published'`, always via a `by_status*` compound index** —
  filters narrow within the published slice (`by_status_price`, `by_status_bedrooms`),
  never scan and post-filter from the full table.
- **Place matching by Google place id**, not string city names: the listing stores its
  city + country place ids (space-joined `placeId`); the search box resolves the same ids.
  Language-independent by construction ("Beograd" and "Belgrade" share an id) — never
  reintroduce string matching next to it.
- **`isSuperhost` is a read-time denormalization** stamped from the host user at
  create/update — search never joins the auth component. Known bounded drift; re-stamped
  on listing writes. Accepted trade (documented on the field), not a bug.
- **`isFeatured`** drives the homepage strip. Today it's set via the Convex dashboard;
  a one-toggle admin action on `/admin/accommodations` is the sanctioned future home
  (`AdminPagesSystemDesign.md` §2 scope note) — never a host-facing option, and never
  purchasable (that would be a monetization mode, §8, not a checkbox).

## 8. Monetization — the per-listing choice (revised 2026-07-31)

> Revision note: the original design here was one platform-wide mode
> (`'none' | 'listing_fee' | 'booking_fee'`). The business decided hosts choose **per
> listing**: pay a flat listing fee up front and keep everything, or list free and give
> the platform a cut of each booking. This section is that §12-promised design revision.
> Both models' machinery already exists (steps 8–9 of the TODO built it under the global
> mode); the revision re-keys the gates from a config constant to a listing field.

```ts
// src/shared/config.ts
export const ACCOMMODATIONS_CONFIG = {
	/** Whether monetization exists at all. 'per_listing' = each listing carries its
	 *  host-chosen model. Flipping requires the §"switch honesty" backfill first. */
	MONETIZATION: 'none' as 'none' | 'per_listing',

	LISTING_FEE: {
		/** Whole euros per period per listing. */
		AMOUNT: 30,
		/** Days a payment buys. 90 ≈ the legacy 3-month subscription. */
		PERIOD_DAYS: 90,
		/** Days past expiry before the cron flips published → expired. */
		GRACE_DAYS: 3,
		/** Days before expiry the reminder email goes out. */
		REMINDER_DAYS_BEFORE: 7
	},

	BOOKING_FEE: {
		/** Percent of the booking subtotal, rounded to whole euros. */
		PERCENT: 10,
		/** Floor in euros so tiny bookings still carry the fee. */
		MIN_EUROS: 2
	},

	// Non-monetization listing limits (enforced server-side, §3):
	MIN_IMAGES: 3,
	MAX_IMAGES: 20
} as const;
```

### The field

`apartments.monetization?: 'listing_fee' | 'booking_fee'` — **the host's choice, made at
creation** (the wizard step below). Optional in the schema so pre-revision rows stay
valid; under `'per_listing'` the create mutation requires it, and the flip backfill stamps
every existing row (see switch honesty). Like `status`, it is **not in the content-edit
surface** (§2, A3) — changing it is its own explicit action with its own rules (see
"Switching models").

### The choice, as the host sees it

The **final step of the create wizard**, "Payments & plan", which pairs the plan choice
with the **guest payment method** (revised 2026-07-31 from "right after Pricing"). The two
belong in one step because they are one decision with two halves: the per-booking plan is
online-only by construction, so choosing it sets the payment method, and a host reading
either field needs the other in view. Last because it is the commitment — every earlier
step describes the property, this one sets the deal, and the per-booking half cannot be
undone once the listing exists.

The payment method's own online options (`online`, `both`) follow the same rule as the
per-booking card: **listed but disabled** while `ONLINE_PAYMENTS_AVAILABLE` is false
(provider unwired OR Phase 2 not shipped), each carrying the same
"available once online payments launch" sentence, so one step never explains one gate two
ways. Hiding them taught hosts nothing about where the platform is going; the server-side
rejection in create/update is unchanged either way (`PaymentsSystemDesign.md` §8).

Two selectable plan cards, plain words, real numbers:

- **Listing fee** — "€30 per 90 days, per listing. Keep 100% of every booking. Accept
  cash or online payments. Your listing goes live after review **and payment**."
- **Per-booking fee** — "Free to list. Guests pay a 10% service fee (min €2) on each
  booking. **Online payments only. Permanent: this plan can't be changed later — to use
  a listing fee instead, you'd create a new listing.**" Selectable only while online
  payments exist (`PAYMENTS_CONFIG.PROVIDER` gate, `PaymentsSystemDesign.md` §8); until
  then the card renders disabled with "available once online payments launch" — visible
  so hosts know the model exists, disabled so nobody can pick what can't work. The
  permanence sentence AND its escape hatch are on the card, not in a tooltip — an
  irreversible choice is stated where it is made, together with the one road around it
  ("Switching models" below).

The `booking_fee` card's copy reappears in the "Change plan" dialog on `listing_fee` rows
(below), so the model is described the same way wherever it is offered. **The edit form
carries this step WITHOUT the plan field** — payment method stays editable, the plan never
is (§2/A3): the update mutation doesn't accept it, so a picker there would offer a choice
the server silently ignores. `booking_fee` rows have no
"Change plan" action at all: the switch is one-way, and a control that only says "you
can't" is noise. Instead, the row's billing column states the fact and the road in
visible text, not a tooltip: **"Per-booking fee (10%) — permanent · new listing to
change plan"** — so a host wondering "how do I switch?" reads the answer where they went
looking for it (`HostSystemDesign.md` §5.2).

### Model `'listing_fee'` — host pays to be listed

The collectable model for a **cash-dominant platform**: the platform charges the host
directly, so it works even though the platform never touches guest money.

- **Fields** (already in the schema from the legacy bank integration — kept, not
  reinvented): `paidAt`, `paymentAmount`, `paymentOrderId`,
  `apartmentSubscriptionExpiryDate`. A successful payment stamps all four. The new period's
  base is **continuity, not a reset**: it extends from `currentExpiry` whenever that expiry
  is still within `GRACE_DAYS` of now (early renewal keeps the unspent days; a late-but-
  in-grace payment buys exactly the coverage paid for, not the grace days as a bonus), and
  from `now` only when the period lapsed past grace (dead time isn't bought back) or no
  period exists yet. Same rule as §11's grace row — one function owns it
  (`nextSubscriptionExpiry`, self-checked), shared by the first payment, host renewal, the
  admin manual stamp, and the flip backfill.
- **The first period gates going live**: `moderateApartmentStatus` **rejects
  `published` for an unpaid `listing_fee` listing** (`LISTING_FEE_UNPAID` message key) —
  the one publish precondition beyond content review. Payment and review are independent
  and can land in either order; publish happens when both have. The admin listings table
  shows an "Awaiting payment" chip on the status cell of any unpaid `listing_fee` row
  (`AdminPagesSystemDesign.md` §2) so the admin never guesses why publish is refused. The host pays from `my-accommodations`
  (adapter `charge()`, flow A — `PaymentsSystemDesign.md` §7) or, until a provider is
  wired, by bank transfer that an admin records with `stampListingFeePayment`
  (audit-logged). The period runs from payment (`nextSubscriptionExpiry`'s from-now
  branch); the payment→publish gap burns a day or two of review time — accepted at this
  platform's review speed, revisit to stamp-at-publish only if hosts actually complain.
- **Staying listed**: on `apartmentSubscriptionExpiryDate + GRACE_DAYS` the daily cron
  flips `published` → `expired` (A2 evidence: machine-readable
  `expiredReason: 'listing_fee_lapsed'`). Reminder email at `REMINDER_DAYS_BEFORE`; lapse
  email at flip. The sweep acts only on rows with `monetization === 'listing_fee'` AND a
  stamped expiry date — `booking_fee` and legacy-unstamped rows are structurally out of
  reach.
- **Renewal**: host pays from `my-accommodations` → `expired` → `published` directly, no
  re-review (§1).
- **Edge — expiry with bookings in flight**: existing `confirmed`/`checked_in` bookings
  live out normally (`expired` blocks _new_ bookings via A1, nothing else). Pending
  requests on a listing that expires die at confirm time (A1 re-check) — the host who
  wants to accept a request renews first, which is exactly the intended pressure.

### Model `'booking_fee'` — platform takes a cut per booking

- **Computation**: `platformFee = max(round(subtotal * PERCENT/100), MIN_EUROS)`, composed
  by `calculatePrice` (§5) **when the listing's `monetization` is `'booking_fee'`** (0
  otherwise), snapshotted into the booking's price block (`BookingSystemDesign.md` §7),
  shown to the guest as a line item before they commit. Fee follows the booking's refund
  fate: refunded when the booking's policy refunds (`BookingSystemDesign.md` §4), kept
  when it doesn't.
- **Online-only, by construction**: a booking fee is only collectable where the platform
  sits in the money flow, so **a `booking_fee` listing must have
  `paymentMethod: 'online'`** — enforced in create/update (choosing the model locks the
  payment method; the form says so on the card). This replaces the old design's
  "recorded-but-uncollectable cash fee" bookkeeping: under per-listing choice that hole
  would be the rational pick for every cash host, so it is closed structurally, not
  documented around. Cash-friendly hosts have the listing-fee model — that pairing IS the
  product: _commission = everything through the platform; flat fee = run it your way._
- Consequence, stated plainly: **while `ONLINE_PAYMENTS_AVAILABLE` is false (provider
  unwired OR Phase 2 not shipped), `booking_fee` is not selectable, so every monetized
  listing is `listing_fee`** — which remains the only model
  that actually earns on a cash-dominant platform. The choice becomes real the day online
  payments land, with zero further schema work.
- No fee on `withdrawn`/`declined`/`auto_declined` — the fee exists only where a stay was
  actually confirmed (it enters at capture/confirm, not at request).

### Switching models — `switchListingMonetization` (one-way, revised 2026-07-31)

Its own mutation (audit-logged), reached from a "Change plan" action on the
`my-accommodations` row — **never** part of the content-edit surface (A3). **The door
swings one way: into `booking_fee`, never out of it.**

- **`booking_fee` → `listing_fee`: FORBIDDEN** — rejected server-side, no UI offers it.
  Why: a well-booked listing pays the platform far more under commission than under the
  flat fee, so an open exit would let every host ride commission-free discovery and then
  escape into the cheap model exactly when escaping costs the platform the most. The
  creation choice is a commitment, and the `booking_fee` card SAYS so ("permanent for
  this listing"). Known leak, accepted: a host can archive and recreate under
  `listing_fee` — that costs them full re-review, a new slug, and detached booking
  history; deterrence enough at this scale, and recreation-prevention machinery is not
  worth building.
- **`listing_fee` → `booking_fee`**: allowed; requires the `booking_fee` preconditions
  (provider live, listing goes online-only). Immediate; **remaining paid days are
  forfeited**, and — per the rule above — **there is no road back**. The dialog states
  all three facts in plain words: "You have N paid days left; switching gives them up.
  This cannot be reversed for this listing — going back to a listing fee would mean
  creating a new listing. No refunds."
- **In-flight bookings are untouched**: `platformFee` is a creation-time snapshot (§0.3)
  — a booking priced under one model keeps that price and that fee through capture,
  whatever the listing switched to meanwhile.

### Platform-revenue events (consumed by `/admin/dashboard`)

The platform's own revenue — as opposed to hosts' booking money (GMV) — is exactly two
streams, and both track the existing `invoice.paid` analytics event at the moment money
becomes the platform's:

- **Listing-fee payment** (adapter `charge()` success, or `stampListingFeePayment`):
  `invoice.paid { amountCents, currency: 'EUR', plan: 'listing_fee' }`.
- **Booking fee at capture** (snapshot `platformFee > 0`):
  `invoice.paid { amountCents: platformFee * 100, currency: 'EUR', plan: 'booking_fee' }`.
  A refunded booking refunds the guest's total including the fee
  (`PaymentsSystemDesign.md` §4), so the same mutation tracks
  `refund.created { amountCents: platformFee * 100, plan: 'booking_fee' }` — platform
  revenue is `revenue − refunds`, and the `plan` dimension splits the two streams for
  free. The admin dashboard's revenue tile and chart read THESE metrics, never GMV
  (`AdminDashboardPageSystemDesign.md` §3).

### Switch honesty (`'none'` → `'per_listing'`)

- The flip backfill stamps `monetization: 'listing_fee'` +
  `apartmentSubscriptionExpiryDate: now + PERIOD_DAYS` (a free first period) on every
  existing listing — they were created under free rules, and `booking_fee` isn't available
  while the provider gate is closed. Reminder + lapse machinery then applies normally.
  Nobody gets unpublished by a config flip alone; nobody pays for time they already had.
- Flipping back to `'none'` strands no one: fee UI hides, the sweep no-ops, paid time
  simply stops mattering. Field values stay put (behavior, not migration — §0.4).

### Rules that hold across both models

- **One model per listing at a time.** The field is a union, not a set — no stacking.
- **Money facts are snapshots.** A paid period keeps its bought length; a booked fee keeps
  its booked percent — config and model changes only affect future actions (same principle
  as `BookingSystemDesign.md` §0.3).
- **Reads branch on `MONETIZATION` first, then the listing field, never on payment-stamp
  presence** — legacy rows carry payment stamps in `'none'` mode.

## 9. Data-loading verdicts (per `GeneralSystemDesignRule.md` — decided here)

| Surface                                        | Verdict                                   | Justification                                                                                                                                                                           |
| ---------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Search page (`/`, `/search`)                   | **Subscription**, cursor-paginated (§9.1) | `usePaginatedQuery` keeps both panes live — a host editing or unpublishing a listing updates it under the viewer. Two reads — cards page in, markers stream — never one whole-set read. |
| Accommodation detail (`/accommodation/[slug]`) | **Subscription**                          | Live keyed on the slug — a host's edit or unpublish reflects instantly. The booking panel's availability truth is still the mutation's re-check, not the page read.                     |
| Host `my-accommodations`                       | **Subscription**                          | Moves under the viewer without their action: admin moderates, the listing-fee cron expires — both while the host watches.                                                               |
| Add / edit accommodation form                  | **Subscription**                          | Single-entity form loads its record live, so a host's own edits and admin moderation show up mid-session; dirty-state stays client-side.                                                |
| Favorites                                      | **Subscription**                          | Saved-ids feed in the layout; the resolved set follows it live, so a removal drops off without a reload.                                                                                |
| Admin `/admin/accommodations`                  | Subscription via DataTable                | Already decided — `AdminPagesSystemDesign.md` §2.                                                                                                                                       |
| Counts (badges, dashboard tiles)               | `counters.apartments`                     | NOW-questions; namespace = status ⇒ **adding `expired` requires the re-backfill ritual**.                                                                                               |
| Created/published/expired trends               | analytics events                          | HAPPENED-questions.                                                                                                                                                                     |

### 9.1 `/search` reads (revised 2026-08-09)

`/search` used to run ONE query returning the entire matching set, because both panes consumed
the same array and the map needs a pin for every result. The list then `.slice(0, 12)`'d it, so a
1,000-listing region shipped 1,000 cards to render 12, and a dated search fanned the availability
join out over all of them — as a live subscription, re-running on every write in the region.

It is now two reads over ONE shared, lazily-filtered stream (`searchAccommodationsStream`), which
is the only thing both panes have in common — so they can never disagree about what matches:

| Read                               | Shape                     | Pagination                                         |
| ---------------------------------- | ------------------------- | -------------------------------------------------- |
| `fetchSearchAccommodationsSafe`    | full card projection      | cursor, 12/page, driven by the infinite scroll     |
| `fetchSearchMapMarkersSafe`        | `{ id, lat, lng, price }` | cursor, 500/page, drained by the client until done |
| `fetchSearchAccommodationCardSafe` | one card                  | none — a point read for the clicked pin            |

Rules this establishes, and why:

- **No cap anywhere.** Per-request cost is bounded by page size plus read guards
  (`SEARCH_DATA.SEARCH_PAGE_MAX_ROWS_READ` / `_BYTES_READ`); a page that stops early hands back
  an exact cursor and `isDone: false`, so the only consequence is one more request. `100,000`
  listings in a region is more requests, never a truncated answer.
  (`OPERATIONAL_LIMITS.SEARCH_SCAN_LIMIT`, the old 200-row sample, is DELETED — it made the
  newest listings invisible to every search once a catalogue outgrew it.)
- **Marker payloads stay four fields.** Adding one is adding it once per listing in the region;
  the card behind a pin is fetched on click instead.
- **The count is exact, for free.** The marker stream walks the whole set, so its length IS the
  result count once drained — no aggregate, no second scan. The header shows `120+` while that is
  still a lower bound.
- **Both are live.** Each pane is a `usePaginatedQuery` subscription over the shared,
  lazily-filtered stream. The stream reads only matching rows, so a host editing or unpublishing
  a listing shows up without a reload — and an unrelated write never re-runs it.
- **Ceiling, named:** progressive markers are right into the tens of thousands. Past that the
  answer is server-side cluster COUNTS (a geo-cell column + one aggregate namespaced by cell,
  individual pins only at high zoom), not more pins. Not built — the marker endpoint is the shape
  it would replace.

## 10. Notifications

| Event                          | Host email | Notes                                            |
| ------------------------------ | ---------- | ------------------------------------------------ |
| Submitted (`pending_review`)   | ✅         | "In review, we'll email you" — sets expectations |
| Published                      | ✅         | Exists today                                     |
| Suspended                      | ✅         | Carries the admin's reason — exists today        |
| Listing-fee reminder (T−7)     | ✅         | `listing_fee` mode only                          |
| Listing-fee lapsed (`expired`) | ✅         | With the renew link                              |
| Archived / edited / deleted    | —          | Host did it themselves; email would be noise     |

Guests are never emailed about listing lifecycle — their surface is the booking system's
(`BookingSystemDesign.md` §8; e.g. a suspension that strands a pending request surfaces as
that request's auto-decline, not as listing news).

## 11. Edge-case ledger

The compact "don't be surprised" table — behavior is defined here even when no code path
says it loudly:

| Edge                                                         | Behavior                                                                                                                                                                                           |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Listing suspended/expired with future `confirmed` bookings   | Bookings live out normally — only NEW bookings are blocked (A1). Cancelling them is a separate human decision (host or admin, per `BookingSystemDesign.md` §4).                                    |
| Listing suspended/expired with `pending` requests            | Requests die at confirm (A1 re-check) or expire naturally; guests get the standard auto-decline email.                                                                                             |
| Host edits price while a request is pending                  | Request keeps its requested price (snapshot, §5). Confirm = accepting that price.                                                                                                                  |
| Host archives with active bookings                           | Allowed — archive is visibility, not cancellation. Bookings live out (same as suspension row above).                                                                                               |
| Host deletes with only terminal bookings                     | Allowed; history renders from booking-stored data with slug fallback, link dead (§4).                                                                                                              |
| Host deletes with any active booking                         | Blocked (`ACCOMMODATION_HAS_ACTIVE_BOOKINGS`).                                                                                                                                                     |
| Host account deleted (admin action)                          | Listings are orphaned assets → admin archives them in the same workflow; `deleteUser` flow lists them first.                                                                                       |
| Slug collision at create                                     | Deterministic suffix; slug never changes after (§4).                                                                                                                                               |
| Missing `timeZone` (legacy rows / failed lookup)             | Readers fall back to `DEFAULT_TIME_ZONE` — never the viewer's zone.                                                                                                                                |
| Superhost flag drift                                         | Bounded by re-stamp on writes (§7); accepted, documented on the field.                                                                                                                             |
| Upload succeeds, save never happens                          | Orphan cron reaps the R2 object (§3).                                                                                                                                                              |
| Config `MONETIZATION` flipped with live data                 | §8 "switch honesty": flip-on backfills `monetization: 'listing_fee'` + a free period on every row FIRST; flip-off strands no one.                                                                  |
| Admin tries to publish an unpaid `listing_fee` listing       | Rejected (`LISTING_FEE_UNPAID`) — the queue's payment chip explains why; publish succeeds once payment is stamped (§8).                                                                            |
| `listing_fee` listing paid, then suspended / never published | Fee is NOT auto-refunded — the period runs; suspension is a fixable conversation (§1). A truly dead paid listing is a human refund (provider dashboard / bank) + archive; volumes are human-scale. |
| Host switches `listing_fee` → `booking_fee` mid-period       | Immediate; remaining paid days forfeited AND no road back — the dialog said both. No proration, no refund machinery (§8).                                                                          |
| Host on `booking_fee` wants `listing_fee`                    | Forbidden (§8's one-way door). Their road is archive + recreate — full re-review, new slug, detached history; the friction is the point.                                                           |
| Booking captured after the listing switched models           | Fee (or its absence) comes from the booking's creation-time snapshot, not the listing's current model (§0.3, §8).                                                                                  |
| Renewal payment during `GRACE_DAYS`                          | Extends from expiry (not from now) — the host loses nothing by paying late within grace. Same rule §8 states; `nextSubscriptionExpiry` is the one implementation.                                  |
| `expired` listing whose content is now stale                 | Renewal still skips review (§1) — staleness is a moderation concern only if reported; suspension remains available.                                                                                |

## 12. Considered and rejected (or deferred)

- **`draft` status** — rejected. The long create form's save-and-continue-later need is a
  client concern: persist form state locally, restore on return. A schema status would
  drag drafts into every status enum, count, and admin queue for a problem localStorage
  solves. Revisit only if cross-device drafting is genuinely demanded.
- **Re-review on edit** — rejected (§2). Snapshot isolation + the suspension lever cover
  it at this platform's scale.
- **Listing content versioning / edit history** — rejected. Audit log captures moderation;
  content history is CMS machinery with no operator question behind it.
- **Purchasable featuring / promoted listings** — rejected as a checkbox; it's a
  monetization model and would enter through §8 with its own design revision.
- ~~**Listing+booking hybrid**~~ — the original rejection ("one mode at a time") was
  revised 2026-07-31 into §8's per-listing choice. What stays rejected: **stacking both
  models on one listing**, **proration/refunds on model switches**, and **the
  `booking_fee` → `listing_fee` switch** (§8's one-way door — an open exit from
  commission would be taken exactly when it costs the platform the most).
- **iCal / channel-manager sync (Booking.com, Airbnb calendars)** — deferred. Real host
  value, real complexity (import/export, conflict policy vs §6 blocks); design when a host
  actually asks.
- **Reviews & ratings** — deferred; belongs with the reputation/no-show cluster
  (`BookingSystemDesign.md` §11), not with listings alone.
- **Video / virtual tours** — rejected for now; R2 cost + player complexity vs photos that
  already convert.
- **Per-listing cancellation policy tiers** — not this document; already deferred with its
  seam in `BookingSystemDesign.md` §4.
- **Auto-archive of long-`expired` listings** — rejected; an `expired` row costs nothing
  and the host's road back (renew) should stay one click.

## 13. Delta from the current implementation

1. **Schema**: add `expired` to `apartmentStatus` (+ `expiredReason?` stamp); everything
   else already exists — including the legacy listing-fee fields (§8) and
   `instantBooking`. Then the `counters.apartments` re-backfill ritual
   (`GeneralSystemDesignRule.md` § table counts).
2. **Config**: add `ACCOMMODATIONS_CONFIG` to `src/shared/config.ts` (§8), `MONETIZATION:
'none'` initially. Move nothing existing.
3. **Mutations**: enforce `MIN_IMAGES`/`MAX_IMAGES` server-side (§3); reject host
   resubmit from `suspended` (§1 — today `setApartmentStatus` accepts `pending_review`
   from any owned status); `deleteUser` admin flow surfaces the user's listings (§11).
4. **Cron**: new daily `listingFeeSweep` (reminder emails, grace, flip to `expired` with
   stamp). Registered now, inert in `'none'`. (Built gated on the old global mode; the §8
   revision re-keys it to `monetization === 'listing_fee'` rows — TODO 10d.)
5. **Booking cross-check**: `confirmBooking` gains the `status === 'published'` listing
   re-check (A1) — implement together with `BookingSystemDesign.md` §12.4.
6. **Emails**: add submitted-confirmation, fee-reminder, fee-lapsed templates (§10) to the
   existing `src/convex/i18n` catalog.
7. **`calculatePrice`**: teach it `platformFee` under `booking_fee` mode (returns 0 in
   other modes) — the booking side already reserves the field.
8. **Admin**: `isFeatured` toggle on `/admin/accommodations` (one action button); manual
   listing-fee payment stamp (audit-logged) until the payments adapter exists.

Order: 1–2 (structure, inert) → 3 (guardrails) → 5 (correctness, ships with the booking
pass) → 4+6 (listing-fee machinery, still inert under `'none'`) → 7–8 (mode UIs). Every
step shippable with `MONETIZATION: 'none'` — the switch flips when the business says so,
not when the code lands.

**Delta from the 2026-07-31 §8 revision** (per-listing choice — implementation checklist
lives in `TODOSystemDesigns.md` step 10d): the `apartments.monetization` field + create-
wizard step + publish gate + per-listing re-key of the sweep/`calculatePrice`/renewal
surfaces + `switchListingMonetization` + the `invoice.paid` platform-revenue tracking.

## § FOR LLMs / AI ASSISTANTS — READ BEFORE TOUCHING LISTINGS CODE

1. **`published` is the only bookable status** (A1). Never write a bookability check that
   enumerates statuses — one equality, and both booking mutations carry it.
2. **Never move a listing's status from a content mutation, or content from a status
   mutation** (A3). The update mutation's validator not accepting `status` is the
   enforcement — keep it that way.
3. **`expired` is cron-only; `published` (from review) is admin-only; `suspended` exits
   only through an admin.** If a UI needs a button that breaks this, the UI is wrong.
4. **Branch monetization behavior on `ACCOMMODATIONS_CONFIG.MONETIZATION` first, then the
   LISTING's `monetization` field — never on payment-stamp presence** — legacy rows carry
   payment stamps in `'none'` mode, and a global constant alone can't tell you a listing's
   model anymore (§8).
5. **Price math goes through `calculatePrice`** — a second composer (in a component, in a
   mutation) is the bug class this design exists to prevent.
6. **Slug is immutable; images are limit-checked server-side; all writes through
   `@/convex/functions`** (A4).
7. **Consult the edge-case ledger (§11) before "fixing" surprising behavior** — most
   surprises there are decisions.
8. **When uncertain, say so in your summary** with the section number, e.g. "kept edits
   status-neutral per AccommodationsSystemDesign.md §2; say the word if this platform
   wants re-review on edit."
