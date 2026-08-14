# System Designs — Implementation Order & Checklist

> The master TODO for implementing the design docs. Work top to bottom — each step is one
> PR-sized unit, independently shippable, and nothing below a step depends on anything
> above being skipped. Check items off as they land. Every item cites the doc section that
> specifies it; the implementing session should read that section (and the doc's
> **§ FOR LLMs** section, plus `GeneralSystemDesignRule.md`) before writing code.
>
> Docs: `BookingSystemDesign.md` (BSD) · `AccommodationsSystemDesign.md` (ASD) ·
> `GuestSystemDesign.md` (GSD) · `HostSystemDesign.md` (HSD) · `PaymentsSystemDesign.md`
> (PSD) · `AdminPagesSystemDesign.md` (APSD) · `GeneralSystemDesignRule.md` (GSDR).
>
> After every step: `bunx svelte-check` + `bunx vite build` must stay clean (they are
> clean today — any new error belongs to the step).

---

## 1. Foundations — schema + config (all inert) — BSD §12.1, ASD §13.1–2, PSD §13.1

⚠️ **Migration order matters.** Convex validates existing rows against the new schema.
For changed value sets (`paymentStatus`) and newly-required fields (`apartmentId`):
**widen the validator (old ∪ new) → run the migration patching existing rows → tighten.**
Three small deploys, not one.

- [x] `bookings`: add `withdrawn` to `bookingStatus` (BSD §2)
- [x] `bookings`: new `paymentStatus` set `on_arrival | awaiting | authorized | paid | released | refunded` + migration mapping old values (`pending`→`on_arrival`/cash, `paid`/`refunded` 1:1) (BSD §5, PSD §9)
- [x] `bookings`: add `platformFee` (0), `policy` snapshot `{ freeCancelDays, hostResponseHours }` (backfill existing rows from current config), `lateCancellation?`, `paymentRef?`, `paymentDeadlineAt?`, `cancelledBy: 'admin'` variant (BSD §7, PSD §9)
- [x] `bookings`: make `apartmentId` required (verify/backfill existing rows first) (BSD §7)
- [x] `apartments`: add `expired` to `apartmentStatus` + `expiredReason?` (ASD §1, §13.1)
- [x] New table `apartmentBlocks` `{ apartmentId, startDate, endDate }` + `by_apartment` index (BSD §6)
- [x] New tables `bookingEarnings`, `hostPayoutAccounts` (PSD §5, §9) — declared, unused
- [x] Config: `ACCOMMODATIONS_CONFIG` with `MONETIZATION: 'none'`, `LISTING_FEE`, `BOOKING_FEE`, `MIN_IMAGES`, `MAX_IMAGES` (ASD §8)
- [x] Config: `PAYMENTS_CONFIG` with `PROVIDER: 'none'`, `CHECKOUT_DEADLINE_MINUTES`, `PAYOUT_TRIGGER: 'checked_out'` (PSD §8)
- [x] Config: `BOOKING_POLICY.PROPERTY_TIMEZONE = 'Europe/Belgrade'` (BSD §3)
- [x] Aggregate re-backfill ritual for changed namespaces (`bookings`, `apartments`) (GSDR § table counts)
- [x] New earnings aggregate (namespace `hostId`, sum `net`) declared + backfilled (PSD §5)

## 2. Booking correctness — the real bug fix — BSD §12.4, ASD A1

- [x] `confirmBooking`: re-run availability check inside the mutation (same shared check as create) (BSD §6)
- [x] `confirmBooking`: re-check listing `status === 'published'` (ASD A1)
- [x] `confirmBooking`: auto-decline overlapping `pending` requests in the same mutation, `cancelledBy: 'system'`, distinct lost-race email copy (BSD §6)
- [x] `createBooking`: availability check includes `apartmentBlocks` (BSD §6)

## 3. Policy mutations + their dialogs — BSD §12.2–3/§12.7, GSD §11.5–6, HSD §10.6

- [x] `withdrawBookingGuest`: set status `withdrawn` (not the cancel path) (BSD §2, §12.2)
- [x] `cancelBookingGuest`: §4 windows per payment method — cash closes at the free-cancel cutoff; online open until day before check-in, non-refundable inside (`lateCancellation` from the **policy snapshot**, property timezone) (BSD §4, §12.3)
- [x] `cancelBookingAdmin`: stamp `cancelledBy: 'admin'` (BSD §12.7)
- [x] Guest cancel dialog: consequence copy from the policy snapshot (on-time vs late variants) (GSD §4)
- [x] Host confirm/decline/cancel dialogs: consequence sentences per the table (payment-aware confirm copy comes with step 8) (HSD §3)
- [x] Reservation page: cover all eight statuses incl. `withdrawn`; payment line; "Book again" respects listing state (GSD §3)
- [x] My-bookings + host queue render `withdrawn` / `auto_declined` variants correctly (GSD §11.6, HSD §3)

## 3b. Stay confirmation — the provable verification norm — BSD §4/§11

- [x] Schema: `stayConfirmationRequestedAt` / `stayConfirmedAt` on bookings (BSD §7)
- [x] Config: `STAY_CONFIRMATION_UNLOCK_HOURS` (24) + `STAY_CONFIRMATION_COOLDOWN_HOURS` (48) — live, not snapshotted (BSD §11)
- [x] `requestStayConfirmation` (host, rate-limited, cooldown) + `confirmStay` (guest capability, idempotent) (BSD §11)
- [x] Guard: cash-inside-window host cancel unlocks only via `stayConfirmationUnlocksCancel` (BSD §4/§11)
- [x] Emails: request → guest (reservation link CTA), confirmed → host FYI; en + sr (BSD §8)
- [x] Guest banner on live reservation page + host panel in the detail sheet (GSD §3, HSD §3)
- [x] Self-check: unlock/relock/stale-confirm edges (`cancellationWindow.check.ts`)

## 4. Time + small guards — BSD §12.5, GSD §11.3

- [x] Lifecycle cron computes "today" in `PROPERTY_TIMEZONE` (not UTC) (BSD §3)
- [x] `createBooking`: duplicate-request guard (same listing+dates+email open `pending` → return existing reservation link) (GSD §2, §9)
- [x] Host resubmit from `suspended` rejected in `setApartmentStatus` (ASD §1, §13.3)
- [x] `MIN_IMAGES` / `MAX_IMAGES` enforced server-side in create/update mutations (ASD §3, §13.3)

## 5. Guest identity + recovery — GSD §11.1–2

- [x] `claimMyBookings` mutation (verified email → patch `guestId` via `by_guest_email`, idempotent) + fire-and-forget hook in auth flow (GSD §1)
- [x] `createBooking` stamps `guestId` when the booker is signed in + stores `guestEmail` lowercased (GSD §1/§9)
- [x] `/reservations` recovery page: code + email form → redirect on exact match, generic failure, rate-limited (GSD §3)

## 6. Host surfaces audit — HSD §10.2/10.4–5

- [x] Reservations queue: default filter Pending, deadline-ascending sort, contact details gated to `confirmed`+ (HSD §3)
- [x] Dashboard band re-rank: pending strip → (earnings card slot) → today → stats (HSD §2)
- [x] Become-host empty state for zero-listing visitors to `/host/**` (HSD §1)
- [x] `/host/dashboard` stays one subscription (HSD §2's "one-shot except the pending strip" split rejected): the pending strip earns live on its own, and the rest of the payload is index-bounded + analytics rollups, so riding along costs ~nothing. Justification comment added at the `useQuery`. Revisit if a leg gets heavy — split the leg, not the page.

## 7. Availability calendar — HSD §10.1 (needs step 1's `apartmentBlocks`)

- [x] Blocks backend: **two** mutations (block/unblock — a third "delete one block" buys nothing over unblock) + one query, shared `nightRangesOverlap` / `nightsInRange` with bookings' `hasAvailabilityConflict`, overlap-with-booked rejected, future-only + `MAX_BLOCK_NIGHTS_PER_ACTION` cap (BSD §12.8, HSD §4)
- [x] Calendar route `/host/my-accommodations/[id]/calendar`: month grid — booked (read-only) / blocked / free; select-range block/unblock, no metadata; entered from the my-accommodations row, and the edit page's Calendar tab was removed so the calendar has one home (HSD §4)
- [x] Subscription wiring per verdict (HSD §2) — `fetchApartmentCalendarSafe` via `useQuery`
- [x] Booked nights link to their reservation: `fetchApartmentCalendarSafe` carries `bookingId` on booked ranges, the cell click navigates to `/host/reservations?booking=<id>`, and the queue opens that booking's sheet via `fetchHostBookingSafe` (fetched directly — the deep-linked stay is rarely on the current filtered page). Closing the sheet drops the param. **HSD §6's host emails should now link to this same address.**

## 8. Payments dark-ship — PSD §13.2–6 (everything behind `PROVIDER: 'none'`)

- [x] Adapter skeleton `src/convex/payments/adapter.ts` — full §7 contract + `fetchPaymentState` (§6's reconciliation read), typed no-op impl that throws under `'none'`. `onlinePaymentsEnabled()` is the one gate every surface reads, so the launch is one constant.
- [x] Checkout flow: `createBooking` online branch (`awaiting`, `paymentDeadlineAt`, no emails/clock/analytics — instant listings start `pending` too), `createCheckoutSession` **action** (mutations can't do network I/O), webhook endpoint at `/payments/webhook` with idempotent handlers; authorization → emails + 48h clock; instant → capture + confirm + ledger row; lost-race → release + `auto_declined` (PSD §3)
- [x] `awaiting` rows made genuinely invisible: excluded from `collectScopedBookings` (both booking tables + tab counts), the host dashboard pending strip, the duplicate-request guard and the confirm-time loser sweep
- [x] Abandoned-checkout reaper in the lifecycle cron (hard-delete `awaiting` past deadline); expiry of an `authorized` request now releases the hold (PSD §3–4)
- [x] Capture in `confirmBooking` (fail-whole — capture runs before the patch, so a failure leaves the booking `pending` with no losers declined and no emails sent) + `PAYMENT_CAPTURE_FAILED` host surface (PSD §3, HSD §3)
- [x] Refund/release wiring into cancel-guest/owner/admin, decline, withdraw and the cron per the §4 matrix; failure → `paymentFlag` on the row (schema delta). The matrix itself is a pure, self-checked function (`paymentSettlementAction` + `.check.ts`) so the closed table can't drift.
- [x] Onboarding stages: silent recipient-account creation on listing `online` toggle (best-effort — never fails the listing); stage-3 earnings card on `/host/dashboard` (aggregate-backed held balance) + "you earned €X" email (en + sr); account/transfer webhooks → `hostPayoutAccounts` (PSD §2, HSD §5)
- [x] Payout sweep cron (three-condition eligibility, transfer-math only) + reconciliation cron (flags stuck/mismatched states) + `flagged` filter arg on `listBookingsAdmin` — the `/admin/bookings` UI that consumes it lands with step 10 (PSD §5–6)
- [x] Dark-ship gate made real: `online` disappears from the listing form's options and is rejected server-side in create/update accommodation and in `createBooking` while `PROVIDER: 'none'` (PSD §8, §11's last row) — step 11's "enable `online` in listing forms" is now just the constant flip

> **Known seam for step 11**: `confirmBooking` calls `adapter.capture()` from a mutation, and
> Convex only allows network I/O in actions. Inert today (`'none'` throws before any I/O), but
> wiring Stripe means promoting that one call site to an action — the shape of the promotion
> depends on the provider's idempotency-key semantics, so it's deliberately not guessed here.
> Checkout, the webhook, the sweep and reconciliation are already actions.

## 9. Listing-fee machinery (inert under `'none'`) — ASD §13.4/6/8

- [x] `listingFeeSweep` daily cron: T−7 reminder (once per paid period — `feeReminderSentAt` guard, cleared by any payment), grace, flip `published` → `expired` with `expiredReason` stamp — no-op unless `listing_fee` mode, and it **skips rows with no `apartmentSubscriptionExpiryDate`** so the mode flip can't unpublish anyone (ASD §8's mode-switch honesty). `backfillListingFeePeriods` is the one-time pre-flip stamp that paragraph names.
- [x] Emails: fee-reminder + fee-lapsed templates (en + sr). Submitted-confirmation already existed (`sendCreateAccommodationEmail`, `live: false`) — ASD §10 row 1 was already satisfied. The lapsed copy states both reassurances: confirmed stays are unaffected, renewal skips re-review (ASD §10, §11)
- [x] Renewal surface on `my-accommodations` rows (mode-gated column replacing the old always-on "Paid/Unpaid" — expiry state + Renew button) + `renewListing` action (adapter `charge()`, flow A) + `stampListingFeePayment` admin mutation, audit-logged with 5-year retention (ASD §8, HSD §5.2)
- [x] Renewal arithmetic extracted + self-checked (`nextSubscriptionExpiry` + `.check.ts`): extend from expiry while within grace, from now past it — ASD §8 and §11 both state this rule now (§8's old `max(now, expiry)` shorthand contradicted §11's grace row; the doc was fixed to the grace-aware rule the code implements)
- [x] `calculatePrice`: `platformFee` under `booking_fee` mode (0 otherwise) — the math already existed; added the missing guest-facing **line item** ASD §8 requires ("shown as a line item before they commit") in the checkout summary + the booking detail sheet, snapshot-sourced on the latter
- [x] Admin: `setApartmentFeatured` mutation, audit-logged (ASD §13.8) — the button lands with step 10's `/admin/accommodations` table, same as `stampListingFeePayment`'s

> **Waiting on step 10**: `setApartmentFeatured` and `stampListingFeePayment` are complete and
> audit-logged, but `/admin/accommodations` is still an empty header — the buttons wire up when
> step 10 builds the listings table, rather than building a throwaway page step 10 replaces.
> (Same shape as step 8's `flagged` filter on `/admin/bookings`.)

## 9b. Docs↔code alignment pass (after steps 8–9)

The design docs were swept for cross-contradictions (8 found, all fixed in the docs), then the
code was brought up to the unified text:

- [x] BSD §8's email matrix completed — the three host emails the table promised but code never sent: guest-cancel → "dates freed", host-cancel → receipt, expiry → "you missed one" instant-book nudge (new `bookingCancelledHost` + `bookingMissed` templates, en + sr); admin-cancel's host copy switched from the guest-template hack to the proper host variant with the reason
- [x] Guest cancellation emails carry the refund status (BSD §8 "+ refund status"): refunded / hold released / kept-on-late-cancel, derived from the actual settlement via `paymentNoteFrom` — a failed refund reports nothing rather than lying
- [x] HSD §6 host-email rules: every host email's CTA deep-links to `/host/reservations?booking=<id>` (step 7's bolded follow-up), and the new-request email states the respond-by DEADLINE as a datetime in the property timezone, not "48 hours"
- [x] `clearPaymentFlag` admin mutation (APSD §3's closing move) — landed early so step 10 is pure UI wiring
- [x] Verified no `awaiting` leak in guest dashboard (status-sliced reads can't see it); instant-capture-failure degrade path confirmed as the kept design (docs + code agree)
- [x] Host cancel now collects a **mandatory reason** (decision reversed from the first alignment pass): `cancelBookingOwner` moved to `zAuthMutation` + `cancelBookingOwnerSchema` (min 4 / max 500, decline pattern), the cancel dialog gained the textarea, and the reason reaches the guest email, the host receipt, and the reservation page (BSD §8, HSD §3)

## 10. Admin pages completion — APSD §8 (independent — can interleave any time after step 1)

> **Order note**: shipped reports' schema FIRST, not last as §8 lists it — the sidebar badge
> reads `counters.reports.count(ns 'new')`, so the namespace has to exist before step 1 can
> work. Everything else followed §8's order.

- [x] Reports schema: `status` (optional, `undefined` = `'new'`) + `by_status` index + `counters.reports` namespace `?? 'new'`; `createReport` now stamps it. **Ritual run on dev** (`clearCounter` → `backfillCounters`) (APSD §4)
- [x] `clearCounter` internal mutation added — the re-backfill ritual was documented in three places but nothing could actually perform the "clear the component" half (GSDR § table counts)
- [x] Sidebar badges: `fetchAdminSidebarBadgesSafe` (two aggregate counts, one subscription in the admin layout), `99+` cap, hidden at zero. `countPendingReviewSafe` and its capped `.take(51)` **deleted** (APSD §1)
- [x] `/admin/accommodations`: listings table + publish/suspend/archive dialogs + feature toggle + fee-stamp dialog (`listing_fee` listings only) (APSD §2). The separate review queue that shipped here was **removed 2026-07-31** — the sidebar badge already says work exists and the status filter shows it, so the queue was a duplicate subscription doing the table's job; its "Awaiting payment" chip moved onto the status cell
- [x] `/admin/bookings`: support lookup + filters incl. **flagged** + row expansion + admin cancel + clear-flag. Row expansion added to the shared `DataTable` (`expandedContent` snippet, real `aria-expanded` disclosure, desktop detail row + mobile inline) — reusable, and what §3 asks for instead of a detail route (APSD §3)
- [x] `/admin/reports`: `listReportsSafe` + `setReportStatus` + inbox UI (New/All segmented control, prose rows not table cells, resolve-with-undo, visible load-more) (APSD §4)
- [x] `/admin/users/[id]`: "View bookings" / "View listings" cross-links, filter state in the URL so a filtered view is a shareable link (APSD §5/§7)
- [x] Doc fix: APSD §7's i18n bullet claimed Paraglide keys, but Paraglide was removed from the project — corrected to English-only UI + backend message keys + the email catalog (the rule that actually holds)

## 10c. Design revision — `/host/analytics` (2026-07-29)

Decision: the revenue chart and per-listing performance table leave the host dashboard for
their own page — the dashboard stays "what needs me, what's today", and the heaviest host
reads run only when a host opens the page that answers "how's business, really?". (Briefly
built as `/admin/analytics` by miscommunication, fully reverted the same day — APSD is back
to five pages and its analytics rejection stands, now pointing at the host page.)

- [x] New page `/host/analytics` — host sidebar group "Analytics" → item "Analytics" (no badge: analytics is a place you go, never a place that needs you). Host-scoped 12-month trend chart + per-listing performance table, best occupancy first, edit-page links (HSD §2/§2b)
- [x] `fetchHostAnalyticsSafe` (live subscription): series from host-scoped pre-aggregated rollups; table from `by_host_status_checkin` slices clipped to the month via `nightsWithinWindow`. No "≥ 2 listings" gate, unlike the old dashboard table — on a page opened to study performance, one row is still the answer (HSD §2b)
- [x] Host dashboard slimmed to pending → earnings → today → tiles: chart + per-listing table removed from the dashboard (`fetchHostDashboardCharts` deleted, `perAccommodation` dropped from `fetchHostDashboardStats`); tiles keep their two-month occupancy/revenue math (HSD §2 revision note)
- [x] Admin side fully reverted: no `/admin/analytics` route/query/components/sidebar entry; `AdminDashboardPageSystemDesign` Band 3 keeps its own platform chart as originally designed
- [x] Dev preview data lives in `host/analytics/dev/` (same tree-shaking gate; delete at launch)

## 10d. Design revision — per-listing monetization + platform revenue (2026-07-31)

Decision: monetization moves from one platform-wide mode to a **per-listing host choice**
(ASD §8 rewritten; PSD §0.1/§1, BSD §10, HSD §5.2, APSD §2 aligned the same day). Hosts
pick at creation: **listing fee** (€30/90d, keep 100%, cash or online, pay-to-go-live) or
**per-booking fee** (free to list, 10% min €2 guest service fee, online-only by
construction — the old "recorded-but-uncollectable cash fee" hole is closed structurally).
`MONETIZATION` becomes `'none' | 'per_listing'`. Same revision fixes the admin dashboard's
revenue definition: **platform revenue** (`invoice.paid − refund.created`), never GMV.

- [x] `/admin/dashboard` built per ADPSD: three bands, one `fetchAdminDashboardPageSafe`
      subscription, `counters.bookings` re-provisioned + backfilled on dev, `countUsers`
      component query (revenue tile still GMV-wired — corrected below)
- [x] Schema + config: `apartments.monetization?: 'listing_fee' | 'booking_fee'`;
      `MONETIZATION: 'none' | 'per_listing'`; create mutation requires the choice under
      `per_listing`; `booking_fee` ⇒ `paymentMethod: 'online'` enforced in create/update
      (ASD §8)
- [x] Create-wizard **final** step "Payments & plan" — guest payment method + the two plan
      cards in one step (they are one decision: `booking_fee` is online-only). Real numbers
      from config; `booking_fee` card AND the `online`/`both` payment options all render
      disabled behind the `PROVIDER` gate with "available once online payments launch"
      (listed, not hidden). The edit form keeps the step but strips the plan field — the
      plan is not editable (ASD §8, §2/A3, HSD §5.2)
- [x] Publish gate: `moderateApartmentStatus` rejects `published` for unpaid `listing_fee`
      listings (`LISTING_FEE_UNPAID`); "Paid / Awaiting payment" chip on the admin review
      queue rows (ASD §8, APSD §2)
- [x] Re-key existing machinery from the global mode to the listing field:
      `listingFeeSweep` (acts on `monetization === 'listing_fee'` + stamped expiry),
      `calculatePrice` platformFee branch, my-accommodations billing column (pay while
      unpaid / expiry + renew after), `renewListing`, `stampListingFeePayment` visibility
      (ASD §8)
- [x] `switchListingMonetization` mutation (audit-logged) + "Change plan" action on
      `listing_fee` rows only: `listing_fee → booking_fee` immediate, forfeits remaining
      days, irreversible — dialog states forfeit + no-road-back + new-listing escape;
      `booking_fee → listing_fee` FORBIDDEN (server-rejected, no UI; one-way door — ASD
      §8 "Switching models"). Permanence is VISIBLE copy at all three surfaces: the
      `booking_fee` create card ("Permanent … you'd create a new listing"), the switch
      dialog, and the my-accommodations `booking_fee` billing column ("permanent · new
      listing to change plan") — never tooltip-only (HSD §5.2)
- [x] Platform-revenue tracking: `invoice.paid` at listing-fee payment
      (`plan: 'listing_fee'`) and at booking capture when snapshot `platformFee > 0`
      (`plan: 'booking_fee'`); `refund.created` for the fee portion on booking refunds
      (ASD §8 "platform-revenue events")
- [x] Admin dashboard revenue fix: `fetchAdminDashboardPageSafe` swaps
      `gmv − gmvCancelled` for `revenue − refunds` in the tile and the chart's revenue
      series; chart empty-state copy per ADPSD §2 (ADPSD Band 3)
- [x] Flip backfill `backfillListingMonetization`: stamp `monetization: 'listing_fee'` +
      free period (`now + PERIOD_DAYS`) on every existing listing — MUST run before
      flipping `MONETIZATION: 'per_listing'` (ASD §8 "switch honesty"; supersedes
      `backfillListingFeePeriods` as the pre-flip step)

## 10e. Pre-launch audit fixes (2026-08-09)

A production-readiness audit of the whole app (everything above was already closed) found
four gaps. Three are fixed here; the fourth is listed under the launch checklist.

- [x] **Rate limits on every PUBLIC, unauthenticated write.** The registry covered every
      authenticated write and all the Better Auth routes, but nothing keyed the four
      endpoints an anonymous browser can call: `createBooking` (mails the host, fills their
      queue), `createReport`, `subscribeToNewsletter`, and the `sendContactFormEmail` remote
      (Resend straight into the company inbox — BotID-gated, never rate-limited). All four
      now charge a bucket: keyed by submitted email (`limitPresets.publicWrite`), by IP for
      the remote, plus one platform-wide `createBookingFloor` for the email-rotation case.
      The contact form reuses the trusted `consumeSearchRateLimit` bridge.
- [x] **`isSuperhost` got its writer** (`setUserSuperhost`, admin-only, audited as
      `user.superhost.update`) plus the toggle on `/admin/users/[id]` → Overview →
      Reputation. Two writes, because the flag is stored twice on purpose: the better-auth
      user row (source of truth, read by `createAccommodation`) and the denormalized
      `apartments.isSuperhost` copy the badge renders from — the latter via the scheduled,
      self-paginating `syncHostSuperhost`, so a host with hundreds of listings doesn't make
      the admin's click wait. There is deliberately no automatic rule: superhost is a
      judgement, not a formula.
- [x] **Dev seeds deleted** — see the launch checklist's first item.
- [x] **Favorites are account-synced** (GuestSystemDesign.md §6, rewritten): new `favorites`
      table, `toggleFavorite` / `mergeFavorites` / `fetchMyFavoriteIdsSafe`. ONE layout-level
      live feed of ids only feeds `favoritesClass` (a subscription alongside `getCurrentUser`;
      the resolved set follows it, so a cross-device removal reflects on the next feed). 30
      hearts on a search page cost zero further queries; the read's `.take(MAX_PER_USER)` bounds
      the hot path with no per-click count; writes are optimistic and settle on the mutation's
      answer; signing in merges the device's anonymous saves, and signed-out visitors keep
      working exactly as before. Cascades on listing- and user-delete.

> **Still open from the same audit** (not code — decisions):
> **no Terms of Service / Privacy Policy pages** (the footer's "Terms of service" links to
> `/`, and Stripe onboarding in step 11 will ask for both URLs), and **no reviews system** —
> `rating`/`reviewCount` are permanently `undefined`, so every card reads "New" forever.

## 11. Go live with Stripe — PSD §13.7 (LAST — gated on business decision)

- [ ] **Business gate**: verify provider support for platform entity jurisdiction + host payout country (PSD §7) — decides whether flow B/C proceed or only flow A via bank API
- [ ] Stripe adapter implementation (Accounts v2 recipient, separate charges & transfers, Checkout Sessions manual capture, transfer-math fees, restricted key) (PSD §7)
- [ ] Sandbox end-to-end: request→authorize→confirm→capture→checkout→transfer; decline/withdraw/late-cancel/refund paths; onboarding stages 2–4 (PSD §3–5)
- [ ] Flip `PAYMENTS_CONFIG.PROVIDER: 'stripe'`; enable `online` in listing forms (PSD §8)

---

## Launch checklist — before the app sees real traffic

Not a build step: these are the things that are correct in development and wrong in
production. Run them in this order on the production deployment.

- [x] **`src/convex/dev/` is gone entirely (2026-08-09).** No seeds, no wipe tool, no
      analytics inspector — nothing under `dev/` ships. The seed `clear*` functions were run
      on dev before deletion (0 rows either side, nothing stranded); remaining rows are being
      cleared by hand from the dashboard. The dead `fetchTestRows` rate-limit bucket went with
      them. **There is no longer any function that can bulk-delete app data** — that is
      deliberate. If a reset is ever needed again, do it from the Convex dashboard, or write
      the tool for that one job and delete it again after.
- [ ] **Run the counter backfills on production.** They have only ever run on dev:
      `bunx convex run functions:backfillCounters "{counter:'reports'}"` and the same for
      `apartments`, `hostEarnings` and `bookings` (the last powers the admin
      dashboard's pulse row). Counts read zero until this happens — badges, dashboard
      tiles and the held-earnings balance all silently under-report.
      ⚠️ **Run `functions:clearCounter "{counter:'X'}"` FIRST for any component that has
      existed before** (notably `bookings`, which shipped once and was removed). A Convex
      component keeps its data across removal + re-adding, so backfilling onto the old tree
      double-counts. Observed on dev 2026-07-31: the dashboard read 2 pending requests
      against 1 real booking until the clear + re-backfill ritual was run. Clearing is
      harmless on a genuinely empty component, so just always clear first.
- [ ] **Re-backfill `apartments` on DEV too.** Its aggregate gained a `hostId` sort key (so
      one tree serves both the admin's platform-wide count and the host dashboard's per-host
      counts), and a changed DEFINITION invalidates the stored tree. Dev has stale entries
      until: `bunx convex run functions:clearCounter "{counter:'apartments'}"` then
      `bunx convex run functions:backfillCounters "{counter:'apartments'}"`. Skipping it
      makes every host's listing tiles read 0.
- [ ] **Backfill the occupancy ledger** (dev AND production):
      `bunx convex run analytics/backfillOccupancyNights:backfillOccupancyNights`.
      Occupancy moved from a read-time booking scan to write-time events
      (`booking.nights_booked`, split per calendar month) so the host dashboard stops scaling
      with portfolio size. Bookings confirmed before that switch emitted nothing, so every
      host's occupancy tile reads 0% until this runs. Idempotent — the events carry a
      `forever`-unique key per (direction, booking, month), so re-running double-counts
      nothing.
- [ ] **Analytics 2.0 sanity pass on production** (after the first deploy on `@piton-/analytics-convex` 2.0): 1. `bunx convex run analytics/analytics:writeConfiguration --prod` — registers the
      config so dashboards can read metrics before the first tracked event does it lazily.
      `predev` runs this on dev automatically; production has no equivalent hook. 2. `bunx convex run analytics/analytics:dataAudit --prod` — expect
      `orphanedMetrics: []`, `orphanedJourneys: []`. Anything listed is rollup data for a
      metric that no longer exists (a rename is a delete plus an add, so renames leave
      ghosts); delete it with
      `bunx convex run analytics/analytics:pruneData "{metrics:['<name>']}" --prod`, which
      refuses any name still in the config. Re-run the audit to confirm. 3. `bunx convex run analytics/analytics:ingestionHealth --prod` — expect
      `pendingAtLeast: 0`, `backlogExceedsCycle: false`. It stays flat zero while every
      metric is `mediumVolume`; it only becomes a number worth watching once some metric
      gets `.trafficMode('highVolume')`.
      No month-actor-claim backfill is needed: this config defines no `distinctActors`
      metric, and the component only writes those claim rows for that aggregation.
      No cron changes to make by hand — `compactAnalyticsRollups` is registered by
      `analytics.registerCrons`, which now schedules four jobs instead of three.
- [ ] **Set `SITE_URL`** on the production deployment — every email link is built from it
      (`src/convex/email/resend.ts`); unset, links point nowhere.
- [ ] **Verify `FEATURES` / mode constants** read the way production wants them:
      `ACCOMMODATIONS_CONFIG.MONETIZATION`, `PAYMENTS_CONFIG.PROVIDER`, `FEATURES.AUDIT_LOGS`.
      Flipping `MONETIZATION` to `'per_listing'` needs the step-10d
      `backfillListingMonetization` run FIRST (ASD §8's switch honesty — stamps every
      existing listing `listing_fee` + a free period; otherwise the sweep expires live
      listings and creates require a choice legacy rows don't have).
- [ ] **Resend out of test mode** — `resend.ts` already sets `testMode: false`; confirm the
      sending domain is verified, or transactional mail silently never arrives.

---

## Backlog (triggered, not scheduled)

- (moved to step 3b — built early by explicit decision)

---

## Standing rules for every step

- One step per implementation session; read the cited sections + the doc's § FOR LLMs first.
- Every mutation touching `bookings`/`apartments`/`reports` uses `@/convex/functions` constructors (GSDR § table counts).
- All user-facing strings: keys in `BACKEND_MESSAGES` for backend messages; emails via `src/convex/i18n` (en + sr same commit).
- New counts → aggregate; new "happened" numbers → analytics events (GSDR).
- `svelte-check` + `vite build` clean before checking a box.
