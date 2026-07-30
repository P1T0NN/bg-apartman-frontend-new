# Accommodations System — System Design

> Status: **target design** (written 2026-07-27). The listings system as it SHOULD be — the
> spec for a re-implementation pass, not documentation of the current code. §13 lists the
> exact delta from what exists; everything not listed there is already correct and stays.
> Companions: `GeneralSystemDesignRule.md` (data rules — cited, never restated),
> `BookingSystemDesign.md` (the consumer of listings — cross-referenced where the two meet),
> `AdminPagesSystemDesign.md` (the moderation UI surface).
>
> This document also owns **platform monetization** (§8) — the listing-fee vs booking-fee
> switch — because a monetization mode is a property of how listings exist on the platform,
> and the config seam lives here. `BookingSystemDesign.md` §10 defers to this section.

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
4. **Monetization is a mode, not a rewrite.** One config switch decides how the platform
   earns (§8). Every mode's hooks exist in the schema permanently; flipping the switch
   changes behavior, never structure.

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
 (listing-fee mode) ▼                                            │ host archives
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

| Status           | Meaning                                 | Visible in search / bookable | Who sets it                                      |
| ---------------- | --------------------------------------- | ---------------------------- | ------------------------------------------------ |
| `pending_review` | Born here; awaiting moderation          | ❌                           | `createAccommodation` (hardcoded); host resubmit |
| `published`      | Live                                    | ✅ (the only one)            | Admin only (`moderateApartmentStatus`)           |
| `suspended`      | Admin pulled it; reason required        | ❌                           | Admin only                                       |
| `expired`        | Listing fee lapsed (`listing_fee` mode) | ❌                           | **Cron only** — never a human                    |
| `archived`       | Host shelved it                         | ❌                           | Host (own listing), admin                        |

### Transition rules (the complete set — anything not listed is forbidden)

- **Host**: create → `pending_review`; any own listing → `archived`; `archived` →
  `pending_review` (resubmit, full re-review — content may have rotted while shelved);
  `expired` → `published` **directly on successful renewal** (content was already approved;
  paying again is not a content event).
- **Admin**: `pending_review` → `published` | `suspended`; `published` ⇄ `suspended`
  (suspension requires a reason — it reaches the host's email); anything → `archived`
  (tidy-up). Admin never sets `expired` and never edits content (§2).
- **Cron**: `published` → `expired` in `listing_fee` mode only (§8). The only machine
  transition in this system.
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
  (`GeneralSystemDesignRule.md` § table counts — `aggregateApartments` namespace = status).

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
  the update mutation's arg validator simply doesn't accept them (A3).

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
  `weeklyDiscount` / `monthlyDiscount` (stay-length percentages), `cleaningFee` (per stay).
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

| Field                                                                                  | Default                                         | Notes                                                                                                                                                          |
| -------------------------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `instantBooking: boolean`                                                              | `false`                                         | This IS `BookingSystemDesign.md` §1's mode flag — `false` = request-to-book, `true` = instant. One boolean, no enum rename.                                    |
| `paymentMethod: 'cash'\|'online'\|'both'`                                              | `'cash'`                                        | `'online'`/`'both'` are selectable only when the payments adapter exists (`PaymentsSystemDesign.md` §8 — `PROVIDER` gate) — the form disables them until then. |
| `minReservationDays` / `maxReservationDays`                                            | 1 / none                                        | Enforced in `createBooking`, displayed on the calendar.                                                                                                        |
| `sameDayReservation`                                                                   | `false`                                         | May a stay start today.                                                                                                                                        |
| `singleDayReservation`                                                                 | `false`                                         | Check-in and check-out on the same date.                                                                                                                       |
| `checkInTime` / `checkOutTime`                                                         | 14:00 / 10:00                                   | Display copy only — never state (`BookingSystemDesign.md` §3).                                                                                                 |
| `quietHoursStart/End`, `petsAllowed`, `smokingAllowed`, `partiesAllowed`, `houseRules` | —                                               | Policy display; no enforcement machinery.                                                                                                                      |
| `timeZone`                                                                             | resolved from pin; fallback `DEFAULT_TIME_ZONE` | The availability calendar runs in the listing's zone, not the viewer's.                                                                                        |

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

## 8. Monetization — `ACCOMMODATIONS_CONFIG`

The platform earns in exactly one of three modes, chosen by config, changeable by deploy:

```ts
// src/shared/config.ts
export const ACCOMMODATIONS_CONFIG = {
	/** How the platform earns. Exactly one mode is active; switching is a deploy. */
	MONETIZATION: 'none' as 'none' | 'listing_fee' | 'booking_fee',

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

### Mode `'none'` — today

Everything free. No cron, no fee lines, no payment surface. The schema hooks below exist
and sit inert — flipping modes later is behavior, not migration (§0.4).

### Mode `'listing_fee'` — host pays to be listed

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
  (`nextSubscriptionExpiry`, self-checked), shared by host renewal, the admin manual
  stamp, and the mode-flip backfill.
- **Lifecycle**: publish requires... nothing extra — moderation approves content; the fee
  gates _staying_ listed. On `apartmentSubscriptionExpiryDate + GRACE_DAYS` the daily cron
  flips `published` → `expired` (A2 evidence: a machine-readable
  `expiredReason: 'listing_fee_lapsed'` stamp). Reminder email at
  `REMINDER_DAYS_BEFORE`; lapse email at flip.
- **Renewal**: host pays from `my-accommodations` → `expired` → `published` directly, no
  re-review (§1). Payment runs through the SAME provider adapter as bookings
  (`PaymentsSystemDesign.md` §7 — the `charge()` operation, flow A); until a
  provider is wired, admins can stamp a manual payment (bank transfer) from the admin
  side, audit-logged.
- **Edge — expiry with bookings in flight**: existing `confirmed`/`checked_in` bookings
  live out normally (`expired` blocks _new_ bookings via A1, nothing else). Pending
  requests on a listing that expires die at confirm time (A1 re-check) — the host who
  wants to accept a request renews first, which is exactly the intended pressure.
- **Mode-switch honesty**: turning `listing_fee` off strands no one (already-paid time
  simply stops mattering); turning it ON gives every currently-published listing a free
  period — the cron only acts on rows whose `apartmentSubscriptionExpiryDate` is set and
  past, and unset rows get stamped `now + PERIOD_DAYS` by a one-time backfill named in
  the flip's deploy notes. Nobody gets unpublished by a config flip alone.

### Mode `'booking_fee'` — platform takes a cut per booking

- **Computation**: `platformFee = max(round(subtotal * PERCENT/100), MIN_EUROS)`, composed
  by `calculatePrice` (§5), snapshotted into the booking's price block
  (`BookingSystemDesign.md` §7 — the field already exists at 0), shown to the guest as a
  line item before they commit. Fee follows the booking's refund fate: refunded when the
  booking's policy refunds (`BookingSystemDesign.md` §4), kept when it doesn't.
- **The honest constraint**: a booking fee is only _collectable_ where the platform sits
  in the money flow — i.e. **online bookings, once the payments adapter exists** (capture
  splits fee from host share via transfer-math; the full collection/payout design is
  `PaymentsSystemDesign.md` §1/§5). On **cash** bookings the platform never touches the money, so a cash booking
  fee is bookkeeping, not revenue — the system records it (honest stats) but nothing
  collects it. Consequence, stated plainly: **while the platform is cash-dominant,
  `listing_fee` is the only mode that actually earns.** `booking_fee` sits ready in config
  for the day online payments land.
- No fee on `withdrawn`/`declined`/`auto_declined` — the fee exists only where a stay was
  actually confirmed (it enters at capture/confirm, not at request).

### Rules that hold across every mode

- **One mode at a time.** No stacking; a listing+booking hybrid is a pricing-strategy
  decision that earns its own design revision if it's ever real.
- **Money facts are snapshots.** A paid period keeps its bought length; a booked fee keeps
  its booked percent — config changes only affect future actions (same principle as
  `BookingSystemDesign.md` §0.3).
- **Reads branch on the mode constant, not on field presence.** `MONETIZATION === 'none'`
  hides all fee UI even if legacy payment stamps exist on old rows.

## 9. Data-loading verdicts (per `GeneralSystemDesignRule.md` — decided here)

| Surface                                        | Verdict                       | Justification                                                                                                             |
| ---------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Search page (`/`, `/search`)                   | One-shot, streamed `+page.ts` | Listings change by host/admin action elsewhere; remount is fresh enough.                                                  |
| Accommodation detail (`/accommodation/[slug]`) | One-shot, streamed            | Same. The booking panel's availability truth is the mutation's re-check, not the page read.                               |
| Host `my-accommodations`                       | **Subscription**              | Moves under the viewer without their action: admin moderates, the listing-fee cron expires — both while the host watches. |
| Add / edit accommodation form                  | One-shot, **awaited** loader  | Single-entity edit form → Pattern B dirty-state (the rule's worked case).                                                 |
| Favorites                                      | One-shot, streamed            | Changes only by this user's own actions elsewhere.                                                                        |
| Admin `/admin/accommodations`                  | Subscription via DataTable    | Already decided — `AdminPagesSystemDesign.md` §2.                                                                         |
| Counts (badges, dashboard tiles)               | `aggregateApartments`         | NOW-questions; namespace = status ⇒ **adding `expired` requires the re-backfill ritual**.                                 |
| Created/published/expired trends               | analytics events              | HAPPENED-questions.                                                                                                       |

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

| Edge                                                       | Behavior                                                                                                                                                          |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Listing suspended/expired with future `confirmed` bookings | Bookings live out normally — only NEW bookings are blocked (A1). Cancelling them is a separate human decision (host or admin, per `BookingSystemDesign.md` §4).   |
| Listing suspended/expired with `pending` requests          | Requests die at confirm (A1 re-check) or expire naturally; guests get the standard auto-decline email.                                                            |
| Host edits price while a request is pending                | Request keeps its requested price (snapshot, §5). Confirm = accepting that price.                                                                                 |
| Host archives with active bookings                         | Allowed — archive is visibility, not cancellation. Bookings live out (same as suspension row above).                                                              |
| Host deletes with only terminal bookings                   | Allowed; history renders from booking-stored data with slug fallback, link dead (§4).                                                                             |
| Host deletes with any active booking                       | Blocked (`ACCOMMODATION_HAS_ACTIVE_BOOKINGS`).                                                                                                                    |
| Host account deleted (admin action)                        | Listings are orphaned assets → admin archives them in the same workflow; `deleteUser` flow lists them first.                                                      |
| Slug collision at create                                   | Deterministic suffix; slug never changes after (§4).                                                                                                              |
| Missing `timeZone` (legacy rows / failed lookup)           | Readers fall back to `DEFAULT_TIME_ZONE` — never the viewer's zone.                                                                                               |
| Superhost flag drift                                       | Bounded by re-stamp on writes (§7); accepted, documented on the field.                                                                                            |
| Upload succeeds, save never happens                        | Orphan cron reaps the R2 object (§3).                                                                                                                             |
| Config `MONETIZATION` flipped with live data               | Defined per mode in §8 ("mode-switch honesty") — no flip unpublishes anyone by itself.                                                                            |
| Renewal payment during `GRACE_DAYS`                        | Extends from expiry (not from now) — the host loses nothing by paying late within grace. Same rule §8 states; `nextSubscriptionExpiry` is the one implementation. |
| `expired` listing whose content is now stale               | Renewal still skips review (§1) — staleness is a moderation concern only if reported; suspension remains available.                                               |

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
  monetization mode and would enter through §8 with its own design revision.
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
   `instantBooking`. Then the `aggregateApartments` re-backfill ritual
   (`GeneralSystemDesignRule.md` § table counts).
2. **Config**: add `ACCOMMODATIONS_CONFIG` to `src/shared/config.ts` (§8), `MONETIZATION:
'none'` initially. Move nothing existing.
3. **Mutations**: enforce `MIN_IMAGES`/`MAX_IMAGES` server-side (§3); reject host
   resubmit from `suspended` (§1 — today `setApartmentStatus` accepts `pending_review`
   from any owned status); `deleteUser` admin flow surfaces the user's listings (§11).
4. **Cron**: new daily `listingFeeSweep` — no-op unless `MONETIZATION === 'listing_fee'`
   (reminder emails, grace, flip to `expired` with stamp). Registered now, inert in
   `'none'`.
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

## § FOR LLMs / AI ASSISTANTS — READ BEFORE TOUCHING LISTINGS CODE

1. **`published` is the only bookable status** (A1). Never write a bookability check that
   enumerates statuses — one equality, and both booking mutations carry it.
2. **Never move a listing's status from a content mutation, or content from a status
   mutation** (A3). The update mutation's validator not accepting `status` is the
   enforcement — keep it that way.
3. **`expired` is cron-only; `published` (from review) is admin-only; `suspended` exits
   only through an admin.** If a UI needs a button that breaks this, the UI is wrong.
4. **Branch monetization behavior on `ACCOMMODATIONS_CONFIG.MONETIZATION`, never on field
   presence** — legacy rows carry payment stamps in `'none'` mode.
5. **Price math goes through `calculatePrice`** — a second composer (in a component, in a
   mutation) is the bug class this design exists to prevent.
6. **Slug is immutable; images are limit-checked server-side; all writes through
   `@/convex/functions`** (A4).
7. **Consult the edge-case ledger (§11) before "fixing" surprising behavior** — most
   surprises there are decisions.
8. **When uncertain, say so in your summary** with the section number, e.g. "kept edits
   status-neutral per AccommodationsSystemDesign.md §2; say the word if this platform
   wants re-review on edit."
