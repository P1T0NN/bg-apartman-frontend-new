# Stripe TODO

Implementation plan for wiring Stripe as the payment provider, scoped to what exists
today. Read **Reality check** first — the payment layer is greener than the design docs
pretend.

---

## 0. Reality check — read before building

- `PAYMENTS_CONFIG.PROVIDER` is `'none'` (`src/shared/config.ts:239`). Every online-payment
  surface is gated on it.
- The adapter (`PaymentsSystemDesign.md` §7) does **not exist**. No `payments/` folder.
- No `action()` exists anywhere in `src/convex` (first Stripe calls must be actions).
  The middleware already has `authAction` / `adminAction` (`authMiddleware.ts:160/218`).
- No webhook. `src/convex/http.ts` registers only auth routes.
- No checkout, no `renewListing`, no `stampListingFeePayment`.
- `TODOSystemDesigns.md` step 8 is marked `[x]` but nothing is in code — stale checkbox.
- Admin dashboard revenue is wired **to read** but the metrics return hardcoded empty
  arrays (`fetchTimeSeries`, `analytics/analytics.ts:113-115`) and nothing tracks
  `invoice.paid` / `refund.created`. The whole revenue metric is built-but-unfed.
- The host listing-fee row explicitly says *"No Pay button: the payment engine is
  stripped … until it's rebuilt"* (`my-accommodations-table-listing-fee.svelte:38-40`).

Scope of THIS doc: **listing-fee only** — host pays €30 → listing publishes/renews, and
admin can refund that payment → listing unpublishes. Booking-fee (guest checkout,
capture/release, host payouts/transfers) is Phase 2 (§9) — do not build it here.

---

## 1. Dependency

```bash
npm i stripe
```

`stripe` package only ever touched inside `src/convex/payments/` — the adapter boundary
(`PaymentsSystemDesign.md` § FOR LLMs: no provider SDK outside the adapter).

---

## 2. Data model (`src/convex/schema.ts`, apartments table)

Add next to the existing payment fields (after `paymentOrderId`, `freeGrantedAt`):

```ts
/** Stripe payment_intent id (`pi_...`) once the listing fee is paid. Refund target
 * for the admin refund action; absence = never paid via Stripe. Not set by the
 * bank-OrderID legacy path. */
paymentRef: v.optional(v.string()),
/** Live Checkout Session awaiting payment — one per listing, so a double-open can't
 * spawn two payable sessions. Cleared on `checkout.session.completed` and
 * `checkout.session.expired`. */
checkoutSessionId: v.optional(v.string()),
checkoutSessionExpiresAt: v.optional(v.number()),
```

The other fields needed already exist: `monetization`, `paidAt`, `paymentAmount`,
`paymentOrderId`, `apartmentSubscriptionExpiryDate`, `feeReminderSentAt`, `freeGrantedAt`,
`status`, `moderatedAt/moderatedBy/moderationReason`, `expiredReason`.

Indexes: **none added** — lookups are by `_id` (admin + webhook) and by the one live
session (`checkoutSessionId` is a rare field, scanned once per webhook, not worth an index).

---

## 3. Config (`src/shared/config.ts`) + env vars

`PAYMENTS_CONFIG` keeps `CHECKOUT_DEADLINE_MINUTES` (unused for listing fee — Stripe owns
session expiry). Flip happens at launch (§8), not now.

Env vars (per deployment, set with `npx convex env set`):

| Var | Value | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | `rk_…` | **Restricted API key** — checkout.sessions write, payment_intents read, refunds create, webhook endpoints. Never `sk_`. |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` | Per environment (test/prod). |
| `STRIPE_API_VERSION` | `2026-06-24.dahlia` | Pin, or omit → SDK default. |

`STRIPE_PRICE` is **not** needed — one-time `price_data` with `LISTING_FEE.AMOUNT * 100`
cents, currency `eur`. No Price objects.

---

## 4. Adapter (`src/convex/payments/`)

```
src/convex/payments/
  adapter.ts        — provider boundary, returns the impl (or throws on PROVIDER 'none')
  stripe/stripe.ts  — Stripe SDK calls only
```

`adapter.ts`:

```ts
export type PaymentAdapter = {
  createListingFeeCheckout(input: {
    amountEur: number; apartmentId: string; title: string;
    successUrl: string; cancelUrl: string;
  }): Promise<{ sessionId: string; url: string; expiresAt: number }>;
  refund(paymentRef: string, idempotencyKey: string): Promise<void>;
  verifyWebhook(body: string, signature: string): Promise<StripeWebhookEvent>;
};

export function getPaymentAdapter(): PaymentAdapter {
  if (PAYMENTS_CONFIG.PROVIDER !== 'stripe') {
    throw new ConvexError({ code: 'PAYMENTS_DISABLED', message: { key: 'GenericMessages.PAYMENTS_DISABLED' } });
  }
  return stripeAdapter;
}
```

`stripe/stripe.ts`:

- One `new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-06-24.dahlia' })` —
  lazy singleton, module scope.
- **`createListingFeeCheckout`** — `checkout.sessions.create`:
  - `mode: 'payment'` (one-time, **automatic capture** — listing fee is captured at once,
    no `capture_method: 'manual'`; manual is only for booking-fee authorize-later).
  - `line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: amountEur * 100, product_data: { name: … } } }]`
  - `client_reference_id: apartmentId` — **the webhook correlation key**.
  - `success_url` / `cancel_url` from the calling action (host returns to their listings).
  - `integration_identifier: 'listing_fee_' + 8 random letters` (required on API ≥
    2026-03-25.dahlia; suffix of 8 random letters).
  - **Never** `payment_method_types` (dynamic payment methods), **never** `payment_method_configurations`
    (dashboard default is fine).
- **`refund(paymentRef, idempotencyKey)`** — `stripe.refunds.create({ payment_intent: paymentRef }, { idempotencyKey })`.
  Full refund, as-charged. `paymentRef` is a PaymentIntent id, so refunds target it
  directly. Never charge-level refunds of the Stripe fee (already excluded by checkout).
- **`verifyWebhook`** — `stripe.webhooks.constructEventAsync(body, sig, STRIPE_WEBHOOK_SECRET)`.
- Everything else in the §7 contract (`capture`, `release`, `transfer`, `createRecipientAccount`,
  `onboardingLink`, `fetchPaymentState`) — **not implemented.**
  `ponytail: booking-fee payouts land in Phase 2; add the stubs then, not now.`

---

## 5. Server functions — call graph

New files (all under `src/convex/tables/accommodations/` unless noted):

| # | Function | Kind | Wrapper | Calls → |
|---|---|---|---|---|
| A | `createListingFeeCheckout` | action | `authAction('createListingFeeCheckout')` | adapter, then nothing (returns URL) |
| B | `stampListingFeePayment` | internal mutation | `internalMutation` | email, analytics |
| C | `clearExpiredCheckout` | internal mutation | `internalMutation` | — |
| D | `refundListingFee` | action | `adminAction('refundListingFee')` | adapter.refund, → E |
| E | `resetListingAfterRefund` | internal mutation | `internalMutation` | email, analytics |
| W | `stripeWebhook` | http action | in `src/convex/http.ts` | → B, → C |

Rate-limit registry (`src/shared/features/rateLimits/data/rateLimitsRegistry.ts`): add
`createListingFeeCheckout: limitPresets.interactiveWrite` and
`refundListingFee: limitPresets.adminAction` (match existing admin entries). Internal
mutations and the webhook are unrated.

Audit actions (`src/convex/tables/auditLog/auditLogConfigs.ts`): add
`APARTMENT_FEE_REFUND: 'apartment.fee.refund'` + `AUDIT_RETENTION_DAYS` entry `365 * 5`
(money-adjacent, same class as `apartment.fee.stamp`).

---

## 6. Flow A — host pays the listing fee (pay · renew)

### 6a. `createListingFeeCheckout` (action, host-callable)

```
Host click "Pay"/"Renew"  →  createListingFeeCheckout({ id, locale, successUrl, cancelUrl })
```

1. `requireAuth`/`authAction`; load apartment; `apartment.hostId === ctx.userId` else forbidden.
2. Gates:
   - `PAYMENTS_CONFIG.PROVIDER === 'stripe'` (else `PAYMENTS_DISABLED`).
   - `listingIsListingFee(apartment)` — booking_fee listing never pays a fee.
   - Status is **payable**: `pending_review` (first payment unlocks publish) or `expired`
     (renewal). `published`/`suspended` → forbidden. The first payment for `pending_review`
     is the fee gate; an `expired` listing revives on payment exactly like a grant does.
3. Live-session guard: if `checkoutSessionId` set and `checkoutSessionExpiresAt > now`,
   return the **existing** session's URL (re-fetch via Stripe or store the URL). If expired
   locally, clear the fields and create fresh. → one payable session per listing.
4. `adapter.createListingFeeCheckout({ amountEur: LISTING_FEE.AMOUNT, apartmentId, title, successUrl, cancelUrl })`.
5. `ctx.db.patch` → `{ checkoutSessionId, checkoutSessionExpiresAt, updatedAt }`.
6. Return `{ success: true, redirectUrl: session.url }`. **Never** treat the redirect as
   proof of payment — webhook is the only truth (§ FOR LLMs rule).
7. `ctx.audit(AUDIT_ACTIONS.ADMIN_ACTION …)` — actually no: this is host-initiated, not an
   admin money action. No audit entry for starting a checkout (not a money event).

### 6b. Webhook `stripeWebhook` (http action, `/stripe/webhook`)

```
Stripe POST /stripe/webhook  →  verifyWebhook(body, sig)  →  switch event
```

- Signature-verify with `adapter.verifyWebhook`; on mismatch return `401` (Stripe retries
  and logs the failure — do NOT swallow).
- Handle only:
  - **`checkout.session.completed`** → parse `client_reference_id` (apartmentId) +
    `payment_intent` + `amount_total` + `currency` → `ctx.runMutation(stampListingFeePayment, …)`.
  - **`checkout.session.expired`** → `ctx.runMutation(clearExpiredCheckout, { sessionId })`.
- Return **`200` for everything else** (unhandled events are a no-op, not an error).
- The handler is a thin pass-through: **no `ctx.db` writes, no email, no analytics here**
  (http actions can't audit/emit safely). All side effects live in the internal mutations.
- Retry-safe: Stripe redelivers until 200. Both internal mutations are idempotent (§ 6c/§ 6d).

### 6c. `stampListingFeePayment` (internal mutation, webhook-called)

1. Load apartment by `_id` (from `client_reference_id`).
2. **Idempotency**: if `paymentRef` already set → return `{ handled: true, already: true }`
   (a redelivered webhook must not double-stamp, double-publish, or double-bill).
3. **Verify against Stripe truth, not the session**: `amount_total === LISTING_FEE.AMOUNT * 100`
   and `currency === 'eur'`. Mismatch → return failure without stamping (flagged for admin,
   never looped — § FOR LLMs).
4. **`listingIsListingFee(apartment)` still true** (the one-way monetization switch could have
   fired mid-checkout). If switched → do NOT publish; return failure without stamping
   (money sits at Stripe; admin resolves via dashboard — a rare manual path, noted not coded).
5. Compute `expiry = nextSubscriptionExpiry(now, apartment.apartmentSubscriptionExpiryDate, LISTING_FEE.PERIOD_DAYS, LISTING_FEE.GRACE_DAYS)` — inside grace this extends from the old
   expiry (continuity rule, same as a grant).
6. `ctx.db.patch`:
   ```
   paymentRef, paymentAmount: LISTING_FEE.AMOUNT,
   paidAt: now,
   apartmentSubscriptionExpiryDate: expiry,
   feeReminderSentAt: undefined,          // fresh period → fresh T−7 reminder
   checkoutSessionId: undefined, checkoutSessionExpiresAt: undefined,
   freeGrantedAt: undefined,              // a payment replaces any earlier grant marker
   status: apartment.status === 'expired' ? 'published' : apartment.status,  // + expiredReason: undefined when reviving
   moderatedAt/moderatedBy/moderationReason as in grantFreePublish (expired revive),
   updatedAt: now
   ```
   Note: `pending_review` **does not auto-publish here** — see § 6e.
7. `recordPlatformRevenue(ctx, paymentRef, amountTotal)` — the `invoice.paid:${paymentRef}`
   SUM rollup (§ 7). No raw `analytics.track` — `fetchTimeSeries` reads only the rollup, and a
   raw event with zero readers is write + prune cost.
8. `ctx.audit(AUDIT_ACTIONS.APARTMENT_FEE_STAMP, …)` — the stamp grants paid time; it audits
   like the bank path.
9. Send `sendAccommodationPublishedEmail` **only** when this payment revives an `expired`
   listing (published for the host). For `pending_review` the publish lands later (§ 6e).

### 6d. `clearExpiredCheckout` (internal mutation, webhook-called)

If `apartment.checkoutSessionId === args.sessionId`, patch `{ checkoutSessionId: undefined,
checkoutSessionExpiresAt: undefined, updatedAt }`. No audit (session that just died, no money).

### 6e. The first-payment publish

Two options — pick one, do it everywhere:

- **(recommended)** `stampListingFeePayment` publishes a `pending_review` listing too
  (the fee was the only gate between the listing and the moderation queue's approval —
  same reasoning as `grantFreePublish`'s `shouldPublish`). Then `pending_review` → `published`
  in step 6c via the same `status` branch, and the published email goes out for both.
- Or leave `pending_review` until an admin hits Publish.

Use option 1 — it mirrors the grant's behavior exactly and removes a hidden dependency on a
manual admin step. One branch: `status: (status === 'expired' || status === 'pending_review') ? 'published' : status`,
with `expiredReason: undefined`.

### 6f. Host frontend

`my-accommodations-table-listing-fee.svelte` — replace the "payment engine is stripped"
placeholder comments with a pay/renew control exactly where the comments sit:

- `fee.kind === 'unpaid'` → **"Pay {amount}€"** button → `createListingFeeCheckout` →
  `window.location.href = redirectUrl`.
- `fee.kind === 'lapsed' || fee.kind === 'grace'` → **"Renew"** button → same action
  (renewal is the same checkout; the webhook revives).
- `fee.kind === 'active' || 'expiring'` → nothing (covered — no button, same as the grant).
- `success_url` / `cancel_url` point back to the host's listings page; the toast text comes
  from the webhook-stamped row re-rendering (or a `?fee=paid` query param), **not** from the
  redirect — the redirect alone proves nothing.

i18n (host group `HostMyAccommodationsPage.MyAccommodationsTableListingFee`): `payNow`
(EN "Pay now", SR "Plati sada"), `renew` (EN "Renew", SR "Obnovi"),
`payListingFeeError` (EN "Payment couldn't be started", SR "Plaćanje nije moglo da počne").

---

## 7. Revenue analytics — the built-but-unfed part (must be built)

`fetchTimeSeries` hardcodes `revenue`/`refunds` to `[]` (`analytics/analytics.ts:113-115`).
Wire them with SUM rollups like gmv:

1. `src/convex/analytics/sumRollups.ts` — add two `DirectAggregate`s:
   - `platformRevenue` → `components.aggregatePlatformRevenue` (new component in
     `convex.config.ts`), namespace `'__platform__'`, day-keyed, sumValue in **cents**.
   - `platformFeeRefunds` → `components.aggregatePlatformFeeRefunds`, namespace = **plan**
     (`'listing_fee'` for now, `'booking_fee'` when Phase 2 lands), day-keyed, cents.
2. Emit points with **paymentRef as the insert id** (`insertIfDoesNotExist` keyed on
   `invoice.paid:${paymentRef}` / `refund.created:${paymentRef}`) — the natural idempotency
   key: a redelivered webhook, a retried action, or a refund-of-a-repaid listing can never
   double-count, and a second payment after a refund gets its own row (fresh `paymentRef`).
3. `fetchTimeSeries`:
   - `metric: 'revenue'` → read `platformRevenue`, return `{ date, revenue }` per bucket.
   - `metric: 'refunds'` → read `platformFeeRefunds` for each known plan namespace, return
     `{ date, booking_fee, listing_fee }` (matches the `SeriesPoint` shape the dashboard
     already consumes).
4. `fetchAdminDashboardPageSafe.ts:103` — subtract both plans:
   `feeRefundCentsByMonth = refundsByPlan.data → p['booking_fee'] + p['listing_fee']`.

Where the events fire:
- `invoice.paid` → inside `stampListingFeePayment` (step 6c), after the patch. Amount =
  `LISTING_FEE.AMOUNT * 100`, plan `'listing_fee'`.
- `refund.created` → inside `resetListingAfterRefund` (step 8c), same amount/cents/plan.
- `grantFreePublish` **deliberately emits nothing** (already true) — free-granted coverage
  never inflates revenue. This is what keeps "my chart didn't count money I didn't get"
  honest in both directions.

---

## 8. Flow B — admin refund (the new action)

### 8a. Gate — when the menu shows "Refund"

In `admin-accommodations-table-actions.svelte`, next to the grant item:

```ts
const refundable = $derived(
    listingIsListingFee(row) && !!row.paymentRef      // paid via Stripe; booking_fee never has one
);
```

- **booking_fee listings**: no `paymentRef` → no item. (Your requirement — booking fees
  aren't refundable this way.)
- Free-granted listings with no payment → no item (nothing to refund).
- A listing that paid, lapsed, then got a free grant → `paymentRef` + `freeGrantedAt` both
  set → **is** refundable (money was taken). The dialog shows what it will do.

i18n: `refundListingFee` + `refundListingFeeConfirm` under
`AdminAccommodationsPage.AdminAccommodationsTableActions`; the backend-returned toasts are
`GenericMessages.REFUND_LISTING_FEE_DONE` / `REFUND_LISTING_FEE_ERROR` (backends return codes,
never UI-group keys); the dialog sends the translated `reason` (`AdminRefundListingFeeDialog.reasonDefault`)
— the backend never writes display text, `moderationReason` is mandatory.

### 8b. `refundListingFee` (action, admin-only, `adminAction('refundListingFee')`)

```
Admin "Refund" → confirm dialog { reason? }  →  refundListingFee({ id, reason, locale })
```

1. `requireAdmin`; load apartment.
2. Gates (re-checked server-side — the UI gate is convenience, this is the boundary):
   `listingIsListingFee(apartment) && apartment.paymentRef`. Absent → return
   `{ success: false, message: FORBIDDEN }` (idempotent safe-pass: a row already reset has no
   paymentRef and is simply not refundable again).
3. `adapter.refund(apartment.paymentRef, idempotencyKey: 'refund:' + apartment.paymentRef)`.
   Stripe dedupes same-key refunds, so a double-click or a retry after a crash is one refund.
4. On success → `ctx.runMutation(resetListingAfterRefund, { id, reason, paymentRef, locale })`.
   On Stripe error → return `{ success: false, message: REFUND_FAILED }`; **state unchanged,
   no loop** (§ FOR LLMs: failures flag, don't retry-loop).
5. Crash-between-refund-and-reset is self-healing: paymentRef still set → admin retries the
   action → same idempotency key → Stripe returns the existing refund → reset runs. Safe.

### 8c. `resetListingAfterRefund` (internal mutation)

1. Re-check `apartment.paymentRef === args.paymentRef` — if already cleared, `return` (the
   reset is a no-op; a second mutation run can't double-reset).
2. `ctx.db.patch`:
   ```
   paymentRef: undefined, paidAt: undefined, paymentAmount: undefined,
   paymentOrderId: undefined, apartmentSubscriptionExpiryDate: undefined,
   feeReminderSentAt: undefined, freeGrantedAt: undefined,
   checkoutSessionId: undefined, checkoutSessionExpiresAt: undefined,
   status: 'pending_review',               // the listing-fee "start state": unpaid, awaits a fresh payment
   expiredReason: undefined,
   moderatedAt: now, moderatedBy: ctx.userId, moderationReason: reason ?? 'Listing fee refunded',
   updatedAt: now
   ```
3. `analytics.track(ctx, 'refund.created', …)` + `platformFeeRefunds` rollup (§ 7) — revenue
   nets to zero for the refunded period.
4. `ctx.audit(AUDIT_ACTIONS.APARTMENT_FEE_REFUND, …)` with `before` (had paymentRef, expiry,
   status) / `after` (reset).
5. Host email — new template `sendListingFeeRefundedEmail` (mirror of
   `sendListingFeeEmails`): the listing is back to pending review, re-pay to go live again.

### 8d. What happens to bookings after a refund

**Existing bookings live out.** Blocking is automatic — status is no longer `published`, so
the search/calendar never surfaces it for new stays (same rule as a suspension:
*grantFreePublish* "a suspended listing does not buy its way back"). Refunds apply only to
the listing fee, never to guest money (that's Phase 2's refund matrix in § FOR LLMs §4).

---

## 9. Phase 2 — booking fee (explicitly NOT now)

Guest online checkout (`createCheckout(bookingId)`, `paymentStatus: awaiting → authorized →
capture on check-in → released on checkout`, manual capture, `transfer`/`netEur`,
`createRecipientAccount`/`onboardingLink`), the `refunds` matrix for booking-fee refunds,
and Connect Accounts. None of it is touched in this pass. `PaymentsSystemDesign.md` §7
adapter contract is the target; this doc only implements its listing-fee slice.

---

## 10. Edge cases — closed list

| # | Case | Handling |
|---|---|---|
| 1 | Webhook redelivered (`checkout.session.completed` twice) | `stampListingFeePayment` no-ops when `paymentRef` set; analytics id-keyed on `paymentRef` |
| 2 | Host double-opens checkout | Live-session guard returns existing URL; one payable session per listing |
| 3 | Session expires unpaid | Stripe fires `checkout.session.expired` → `clearExpiredCheckout`; no cron, no orphan fields |
| 4 | Webhook amount ≠ `LISTING_FEE.AMOUNT*100` or currency ≠ eur | Refuse to stamp, return failure, admin-flagged; never auto-loop |
| 5 | Monetization switched `listing_fee → booking_fee` mid-checkout | Stamp refuses (no publish), money at Stripe, manual admin resolution — rare, documented not coded |
| 6 | Admin double-clicks Refund | Stripe idempotency key dedupes; reset mutation re-checks `paymentRef` |
| 7 | Refund succeeds, reset mutation crashes | Retry action re-refunds same idempotency key → existing refund → reset runs |
| 8 | Stripe refund API fails | `refundListingFee` returns failure, row untouched, admin sees error; no retry loop |
| 9 | Paid → lapsed → granted free coverage → admin refunds | `paymentRef` present so refundable; reset clears both payment fields AND `freeGrantedAt`; money honestly refunded, coverage gone |
| 10 | booking_fee listing | No `paymentRef` → refund item never renders, action forbidden server-side |
| 11 | Free-granted, never paid | No `paymentRef` → nothing to refund; item hidden |
| 12 | Renewal during grace | `nextSubscriptionExpiry` extends from old expiry (continuity), same as grants |
| 13 | Refund of a listing with live bookings | Bookings live out; listing stops being bookable because status ≠ published |
| 14 | Webhook signature mismatch | `401`, Stripe logs + retries; nothing stamped |
| 15 | `PROVIDER === 'none'` (before launch) | `getPaymentAdapter` throws `PAYMENTS_DISABLED`; no checkout, no refund, revenue stays zeros |

---

## 11. Launch order (one committed step at a time)

1. `npm i stripe`; add `paymentRef`/`checkoutSessionId`/`checkoutSessionExpiresAt` to schema.
2. Adapter (`adapter.ts` + `stripe/stripe.ts`), listing-fee slice only.
3. `createListingFeeCheckout` action + registry entry; host pay/renew UI
   (`my-accommodations-table-listing-fee.svelte`) + i18n.
4. Webhook route in `http.ts` + `stampListingFeePayment` + `clearExpiredCheckout` (internal).
5. Revenue plumbing: 2 new aggregate components in `convex.config.ts`, `sumRollups` additions,
   `fetchTimeSeries` `revenue`/`refunds` branches, dashboard subtraction of `listing_fee`.
6. Refund: audit key + `refundListingFee` action + `resetListingAfterRefund` + admin menu
   item/dialog + refund email template + i18n.
7. **Sandbox E2E before touching `PROVIDER`**: test keys (`npx convex dev` for a dev
   deployment + `stripe listen --forward-to <dev>/stripe/webhook`), pay, expire, refund.
8. Flip `PAYMENTS_CONFIG.PROVIDER` → `'stripe'`; set `STRIPE_SECRET_KEY` /
   `STRIPE_WEBHOOK_SECRET` per environment; create the webhook endpoint in the Stripe
   dashboard for the matching deployment. Admin revenue starts reporting real numbers.

Files touched: `schema.ts`, `config.ts`, `convex.config.ts`, `http.ts`,
`authMiddleware` (no — wrappers exist), `rateLimitsRegistry.ts`, `auditLogConfigs.ts`,
`analytics/{sumRollups,analytics}.ts`, `fetchAdminDashboardPageSafe.ts`,
`admin-accommodations-table-actions.svelte` + a refund dialog, `my-accommodations-table-listing-fee.svelte`,
new: `src/convex/payments/{adapter.ts,stripe/stripe.ts}`,
`src/convex/tables/accommodations/mutations/{createListingFeeCheckout,stampListingFeePayment,clearExpiredCheckout,refundListingFee,resetListingAfterRefund}.ts`,
`sendListingFeeRefundedEmail.ts`, `messages/{en,sr}.json`.
