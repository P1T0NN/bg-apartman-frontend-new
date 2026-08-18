# Payments System — System Design

> Status: **target design** (written 2026-07-27). How money moves on this platform: guest
> checkout, host progressive onboarding, capture/refund/release, payouts, and the provider
> adapter. This document OWNS the provider seam that `BookingSystemDesign.md` §5 sketched
> and `AccommodationsSystemDesign.md` §8 charges through — both now defer here (their
> pointers were updated in the same commit as this file).
>
> Named `PaymentsSystemDesign.md`, not `StripeSystemDesign.md`, deliberately: the adapter
> (§7) is provider-agnostic — the listing-fee `charge()` can be implemented by a bank API
> (the legacy `paymentOrderId` fields prove it once was), and every booking-flow rule below
> is stated in provider-neutral terms first. **Stripe is the chosen reference
> implementation**, and §7 pins its exact shape; swapping providers is one file, not a
> redesign.
>
> This is the highest-stakes document in the set. The rules here are conservative on
> purpose: money only moves forward, webhooks are the only truth, and every ambiguous
> failure resolves to "a human is told", never "a retry loop guesses".

## 0. Operating principles

1. **Never ask for money information before money exists.** Signup collects name + email.
   Listing creation collects nothing financial. Bank details are requested exactly once,
   at the moment the host has earnings to claim — when the ask is a gift, not a form
   (§2). A host who never takes online bookings never sees a payment form, ever. The one
   opt-in exception: a host who CHOOSES the listing-fee model
   (`AccommodationsSystemDesign.md` §8) is asked to pay the fee itself — that is the
   product they picked, not payout onboarding, and the payout rules above still apply to
   them untouched.
2. **Guest checkout never depends on host onboarding state.** The platform charges the
   guest; the host's share waits in the ledger until the host is payable. A guest must
   never see "this host hasn't finished setup" — that's the platform's problem, invisible
   by construction (§1, §5).
3. **Webhooks are the only truth.** No payment state is written from a client redirect, a
   success page, or an optimistic assumption. The provider confirms; then we write. The
   guest-facing gap is covered by pages that are already live (`GuestSystemDesign.md` §3).
4. **Money only moves forward.** Capture only after confirm; transfer to the host only
   after the booking is terminal with money owed (§5). There is no state in this design
   where money must be clawed back from a host — that failure mode is excluded
   structurally, not handled.
5. **Booking state and payment state stay decoupled** (`BookingSystemDesign.md` §5): the
   status says where the stay is, `paymentStatus` says where the money is. This document
   only ever moves `paymentStatus`; stay transitions stay owned by the booking system.

## 1. The three money flows

| Flow | Who pays whom                 | Gate (listing's `monetization`, under `MONETIZATION: 'per_listing'`) | Mechanism                                                                                                                                                                                                                                                    |
| ---- | ----------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A    | Host → platform (listing fee) | `listing_fee` listings                                               | Plain one-time charge (§7 `charge()`) — no Connect, no payout machinery. First payment gates publish; renewal lifecycle: `AccommodationsSystemDesign.md` §8.                                                                                                 |
| B    | Guest → platform (booking)    | any listing with online payments enabled                             | Checkout with **manual capture**: authorize at booking, capture at confirm (§3, §4). Platform is merchant of record.                                                                                                                                         |
| C    | Platform → host (payout)      | follows B                                                            | **Separate charges and transfers**: platform holds funds, transfers the host's net share when the booking is terminal-with-money-owed AND the host is payable (§5). Platform fee = transfer-math (transfer less than gross), never a provider fee parameter. |

Why separate charges & transfers and not destination charges (the other marketplace
pattern): destination charges push funds toward the host at payment time — the provider
itself documents them as wrong for hold-and-release. Our §0.4 invariant (no clawbacks)
requires the platform to hold funds until the stay resolves; separate charges are the
sanctioned pattern for exactly that, and they are what makes §0.2 true (charging works
before the host has any payout account at all).

Cash stays cash: `paymentMethod: 'cash'` bookings never enter this document — `on_arrival`
end to end (`BookingSystemDesign.md` §5). A cash booking can only exist on a `listing_fee`
listing — `booking_fee` listings are online-only by construction
(`AccommodationsSystemDesign.md` §8), which is what makes the fee collectable at all.

## 2. Progressive host onboarding — the psychology, made mechanical

The principle: **onboarding friction is spent only against a visible reward.** Five stages,
each with its exact trigger and its exact ask:

| Stage | Trigger                                         | What the host is asked                                                                                                                                                                                                              | What happens silently                                                                                                                                                                    |
| ----- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Signup                                          | Name, email, password. **Nothing financial.**                                                                                                                                                                                       | —                                                                                                                                                                                        |
| 1     | Creates a listing                               | **Nothing financial.** Default payment method is cash.                                                                                                                                                                              | —                                                                                                                                                                                        |
| 2     | Toggles `online` on a listing                   | Nothing — one passive sentence: "Online payments are handled by our payment partner; you'll add payout details once you have earnings."                                                                                             | Recipient account created with what we already know (email, country). No forms, no redirect. If creation fails, the toggle still succeeds — the account retries lazily at stage 3 (§11). |
| 3     | First online booking **captured** (host earned) | The one ask, at the dopamine peak. Email + dashboard card: **"You earned €{net}. It's being held for you — add your payout details (~3 min) to receive it."** → provider-hosted onboarding, return link back to the host dashboard. | Earnings accumulate in the ledger as `held` (§5). Nothing expires, nothing is lost by waiting.                                                                                           |
| 4     | Provider confirms transfers active (webhook)    | Nothing, ever again (remediation via the provider's notification surface if regulations later want more).                                                                                                                           | Payout sweep starts moving `held` → `transferred` (§5). The card becomes an earnings summary.                                                                                            |

Non-nagging rules (as binding as the stages):

- **One persistent dashboard card, zero modals, zero interstitials.** The card shows the
  held balance and one button. It never blocks any host action.
- **Email mentions the balance only when it grows** (each new capture), never on a timer.
  The growing number is the drip campaign.
- **Copy never says "verify your identity", "KYC", or "compliance".** It says "add your
  payout details to receive €X". The regulatory steps live inside the provider-hosted
  flow, which is built to ask only what's legally required, incrementally.
- **The host can decline forever.** Money holds indefinitely in the ledger; a host who
  only ever wanted cash guests just... has some euros waiting. Support can point at the
  card. Nothing breaks.

## 3. Guest checkout

### The uniform flow — one shape for request-to-book AND instant

Always **authorize now, capture at confirm**. The two listing modes differ only in _when_
confirm happens (host click vs immediately in the webhook), so there is exactly one
checkout implementation:

```
createBooking(online)                       [mutation]
  → availability + rules checks (BookingSystemDesign §6)
  → booking row: status 'pending', paymentStatus 'awaiting',
    paymentDeadlineAt = now + CHECKOUT_DEADLINE_MINUTES
  → NO emails yet, NO host clock yet
  → adapter.createCheckout(bookingId) → guest goes to the provider-hosted payment page

guest completes payment (authorization only — no money moves)

webhook: authorization confirmed             [http action → mutation]
  → re-check availability (same shared check — the truth at money-time)
  ├─ available, listing 'request':  paymentStatus 'authorized';
  │     stamp pendingExpiresAt = now + 48h; send the request emails
  ├─ available, listing 'instant':  adapter.capture → paymentStatus 'paid';
  │     status 'confirmed'; ledger row created; send the confirmed emails
  └─ dates lost meanwhile:          adapter.release → 'released';
        status 'auto_declined' (the §6 lost-race copy); guest emailed "not charged"
```

Decisions embedded in that diagram, each deliberate:

- **`awaiting` is a new `paymentStatus` value** (this doc amends
  `BookingSystemDesign.md` §5 — noted there): the row exists, checkout is open, nobody has
  been told anything. An `awaiting` booking is invisible — no emails, no host queue entry,
  no dates blocked (`pending` never blocks dates anyway).
- **The host's 48h clock starts at authorization, not at row creation** — an abandoned
  checkout must not eat the host's response window.
- **Abandoned checkouts are reaped, hard-deleted, by the lifecycle cron** after
  `paymentDeadlineAt`: no email was ever sent, no human ever saw the row, nothing
  references it. Deletion here is not a status-machine violation — the booking never
  entered the machine. (A _completed_ checkout that lost the race is different: the guest
  finished a real flow, so they get a real row — `auto_declined` — and a real page.)
- **The redirect return page is dumb on purpose** (§0.3): it shows "finalizing your
  request…" and the live reservation page (`GuestSystemDesign.md` §3 — already a
  subscription) flips the moment the webhook lands. No state is written from the return.
- **The payment surface is the provider-hosted checkout page** (reference impl §7):
  SCA/3DS, wallets, and payment-method mix are the provider's problem, dynamically
  optimized. An embedded element is a v2 polish, not a v1 need.
- **Provider calls live in actions, state writes in mutations**
  (`BookingSystemDesign.md` §5's standing rule): `createCheckout` runs in a follow-up
  action after `createBooking` returns (a mutation cannot do network I/O — and needs
  nothing back, since the webhook owns every state write), and the webhook endpoint is an
  httpAction that calls capture/release BEFORE invoking the mutation that records the
  result — money moves first, then the record of it.
- **Instant capture failing inside the webhook degrades to the request flow**: the hold is
  still good, so the booking becomes a normal `authorized` request (48h clock, request
  emails) with a `capture_failed` flag for the admin — instead of dying. If the host then
  confirms, capture is retried there (§3 below); if nobody acts, expiry releases the hold
  (§4). The booking is only lost when the money is actually unreachable.

### Request-mode capture — when the host clicks confirm

`confirmBooking` (already re-checking availability + listing status,
`BookingSystemDesign.md` §6 / `AccommodationsSystemDesign.md` A1) additionally:
`adapter.capture(paymentRef)` → on success `paymentStatus 'paid'`, ledger row created,
proceed as today. On capture failure (hold expired, card died — rare): **the confirm fails
whole**, booking stays `pending`, host sees "payment failed — ask the guest to rebook".
No partial confirm exists.

## 4. The policy → money matrix

The booking system decided who may cancel when (`BookingSystemDesign.md` §4). This table
is the money consequence of every one of those rows — complete, no other refund paths
exist:

| Event (booking side)                                                  | Payment action (this doc)                                                                         | Resulting `paymentStatus`                  |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Withdraw / decline / expire of `authorized`                           | `release` (hold, no money moved)                                                                  | `released`                                 |
| Checkout abandoned (`awaiting` + deadline)                            | nothing to do (hold expires with the session); row reaped                                         | — (row deleted)                            |
| Guest cancels **on time** (`paid`)                                    | `refund` (full)                                                                                   | `refunded`                                 |
| Guest cancels **late** (`paid`)                                       | **nothing** — host keeps it                                                                       | stays `paid` (+ ledger row stays owed, §5) |
| Host cancels — online: only possible outside the free window (BSD §4) | `refund` full / `release`                                                                         | `refunded` / `released`                    |
| Admin cancels (`paid` or `authorized`)                                | `refund` full / `release`                                                                         | `refunded` / `released`                    |
| Refund/release API call fails                                         | `paymentStatus` unchanged; row flagged for admin (`/admin/bookings` filter) — a human finishes it | unchanged + flag                           |

- **All refunds are full refunds.** The policy has no partial tiers
  (`BookingSystemDesign.md` §4) so the money side has none either — one less class of
  arithmetic to get wrong.
- **Refunds always come out of platform-held funds** — the transfer-eligibility rule (§5)
  guarantees the money hasn't left for the host yet in every refundable state. This is
  §0.4 doing its job: the matrix has no "reverse the transfer" row because that row is
  unreachable.
- Refund of the platform fee: refunded bookings refund the guest's **total** (fee
  included) — the platform never profits from a stay that didn't happen.

## 5. Payouts and the earnings ledger

### The ledger — `bookingEarnings` (new table)

One row per **captured** booking, created at capture time, immutable amounts:

```
bookingEarnings: {
  bookingId, hostId,
  gross: number,          // what the guest paid (EUR)
  platformFee: number,    // from the booking's price snapshot (0 unless a booking_fee listing)
  net: number,            // gross - platformFee — what the host is owed
  status: 'held' | 'transferred' | 'returned',   // returned = booking was refunded
  transferRef?: string, transferredAt?: number
}
```

- `refund` (§4) flips the row to `returned` — earnings truth follows money truth in the
  same mutation.
- **Host balance ("€X waiting", stage-3 card) = sum of `net` over `held` rows** — a
  NOW-question → aggregate with namespace `hostId`, sum key `net`
  (`GeneralSystemDesignRule.md` § table counts; new aggregate, backfill ritual applies).
  Earnings _history_ and trends are analytics events, as always.

### Transfer eligibility — the one rule

A `held` row becomes transferable when **ALL THREE** hold:

1. Booking status is **terminal with money owed**: `checked_out`, or `cancelled` with
   `lateCancellation: true` (the host keeps late-cancel money —
   `BookingSystemDesign.md` §4).
2. Host is **payable**: provider confirms transfers active (§2 stage 4, tracked on
   `hostPayoutAccounts` by webhook).
3. The daily **payout sweep** cron picks it up: `adapter.transfer(net, hostAccount)` →
   `transferred` + refs stamped. Transfer failure → row stays `held`, flagged for admin
   (§0's "a human is told"), retried by the next sweep only after the flag is cleared.

Why terminal-only (and not Airbnb's check-in +24h): between check-in and check-out the
admin emergency brake can still refund (`BookingSystemDesign.md` §4) — paying the host
before `checked_out` would create the clawback state §0.4 forbids. The cost is honest: on
a 3-night stay the host waits ~3 extra days. A `PAYOUT_TRIGGER` config knob can move this
to check-in later **only** together with a designed clawback story — it is not a free
constant to flip (§8 note).

### `hostPayoutAccounts` (new table)

`{ hostId, providerAccountId, transfersActive: boolean, updatedAt }` — created silently at
stage 2, `transfersActive` maintained exclusively by account webhooks, read by the sweep
and the stage-3/4 UI. Never read inline during guest checkout (§0.2 — checkout doesn't
care).

## 6. Webhooks and reliability

- **One endpoint** (Convex `httpAction`), signature-verified, secret in env. Events it
  must handle: authorization confirmed, capture succeeded, refund succeeded, account
  capability changed, transfer succeeded/failed. Everything else: 200 and ignore.
- **Idempotent by construction**: every handler is "load booking/account → is the target
  state already written? → no-op or write". Provider retries and duplicate deliveries are
  therefore harmless; no processed-events table needed until proven otherwise.
- **Out-of-order tolerance**: handlers key on object refs (`paymentRef`), never on event
  sequence. A capture event arriving before its authorization event's write resolves on
  the provider-object re-fetch inside the handler.
- **Reconciliation, not sagas**: a daily cron sweeps non-settled money states
  (`awaiting` past deadline+grace, `authorized` older than the response window,
  `held`+eligible but untransferred, flagged rows) and compares against provider truth via
  the adapter; mismatches → admin flag. This is the entire failure-recovery system —
  volumes are human-scale and every flow already fails toward a flagged row a human can
  finish (§4, §5).
- **Client redirects never write state** (§0.3) — restated here because it is the rule
  most casually violated in payment integrations.

## 7. The adapter — one file owns the provider

`src/convex/payments/adapter.ts`. The full contract (grown from
`BookingSystemDesign.md` §5's three ops, which defer here now):

```
charge(amountEur, meta)          → chargeRef          // flow A (listing fee)
createCheckout(bookingId)        → redirectUrl        // flow B — manual capture
capture(paymentRef)              → void
release(paymentRef)              → void
refund(paymentRef)               → void               // always full (§4)
createRecipientAccount(host)     → providerAccountId  // stage 2, minimal fields
onboardingLink(providerAccountId)→ url                // stage 3 card button
transfer(netEur, providerAccountId, meta) → transferRef   // flow C sweep
verifyWebhook(request)           → typed event        // §6 endpoint uses only this
fetchPaymentState(paymentRef)    → provider truth     // §6 reconciliation's compare read
```

Booking/listing mutations call these names and never a provider SDK. A bank-API
implementation of `charge()` alone is enough to run `listing_fee` mode with no Connect at
all.

### Stripe — the reference implementation (pinned so the implementing LLM doesn't guess)

- **Accounts v2** (`/v2/core/accounts`) for hosts: recipient configuration requesting
  `stripe_transfers` only — never the legacy `type: 'express' | 'custom'` creation, never
  a merchant configuration on hosts (it lengthens onboarding for nothing). Dimensions:
  `dashboard: "express"`, `fees_collector: "application"`, `losses_collector:
"application"` (the marketplace triple — required for the separate-charges pattern).
- **Payability check** (§5.2) reads the v2 capability path
  (`configuration.recipient.capabilities.stripe_balance.stripe_transfers.status ===
'active'`), maintained by account webhooks — not the deprecated `payouts_enabled` /
  `charges_enabled` fields.
- **Checkout Sessions** for flows A and B (hosted page; manual capture for B via
  `payment_intent_data.capture_method: 'manual'`). Never the Charges API, never
  `payment_method_types` (dynamic payment methods stay on), and tag sessions with an
  `integration_identifier`.
- **Fees by transfer-math only** (§1 flow C): `application_fee_amount` is incompatible
  with separate charges and transfers — its presence anywhere in this codebase is a bug.
- **Onboarding** via the hosted/embedded flow the provider maintains (account links /
  `account_onboarding` component + the notification banner for later remediation) — never
  API-built KYC forms (§2's copy rules depend on the hosted flow's incremental asks).
- **Restricted API key** (`rk_`), not a raw secret key; webhook secret separate.
- **Go-live prerequisite, business-level**: provider support for the platform's legal
  country and for hosts' payout country must be verified before wiring (Serbia's coverage
  is historically limited — this may decide the platform entity's jurisdiction, or route
  flow A to the bank API while B/C wait). The adapter seam exists precisely so this
  business decision doesn't block the rest of the build.

## 8. Config

```ts
// src/shared/config.ts
export const PAYMENTS_CONFIG = {
	/** 'none' until an adapter implementation is wired and verified (§7). */
	PROVIDER: 'stripe' as 'none' | 'stripe',

	/** Phase 2 — per-booking fee + guest online checkout are NOT built (StripeTODO §9/§10).
	 *  While false the ONLY pay surface is the listing fee. Flip with the Phase-2 build. */
	BOOKING_FEE_ENABLED: false,

	/** Minutes an 'awaiting' checkout may live before the reaper deletes the row (§3). */
	CHECKOUT_DEADLINE_MINUTES: 30,

	/** When held earnings become transferable. 'checked_out' is the no-clawback
	 *  invariant (§5) — do NOT flip to 'check_in' without designing the clawback story
	 *  this constant currently makes unnecessary. */
	PAYOUT_TRIGGER: 'checked_out' as const
} as const;

/** Online guest checkout exists only when BOTH halves hold: provider wired AND Phase 2
 *  shipped. The single gate every online surface reads — server mutations and the
 *  host/admin forms (the listing fee is a host-side payment, independent of this). */
export const ONLINE_PAYMENTS_AVAILABLE =
	PAYMENTS_CONFIG.PROVIDER === 'stripe' && PAYMENTS_CONFIG.BOOKING_FEE_ENABLED;
```

Fee _amounts_ stay where they live (`ACCOMMODATIONS_CONFIG` — `LISTING_FEE`,
`BOOKING_FEE`); this config is plumbing, not pricing. One note that belongs to pricing but
is decided here: `BOOKING_FEE.PERCENT` is the platform's gross margin — provider
processing costs come out of it, so it must be set with those rates in view (the fee
config's comment should say so).

## 9. Data model (deltas)

- `bookings`: `paymentStatus` set becomes `on_arrival | awaiting | authorized | paid |
released | refunded` (amends `BookingSystemDesign.md` §5 — `awaiting` added);
  `paymentDeadlineAt?: number`; `paymentRef?: string` (already reserved there).
- New: `bookingEarnings` (§5), `hostPayoutAccounts` (§5) — plus the earnings aggregate
  (namespace `hostId`, sum `net`) and its backfill ritual.
- Nothing on `apartments` — listing-fee fields already exist
  (`AccommodationsSystemDesign.md` §8).

## 10. Cross-document consistency map

| Decision consumed / amended                | Where                              | Effect here                                                                                                                                          |
| ------------------------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Payment states + provider seam sketch      | `BookingSystemDesign.md` §5        | **Amended**: `awaiting` added; seam ownership moved here (pointer edited there).                                                                     |
| Cancellation windows / who-may-cancel      | `BookingSystemDesign.md` §4        | §4 matrix is its money mirror — row-for-row.                                                                                                         |
| 48h host window vs card-hold validity      | `BookingSystemDesign.md` §1        | §3 starts the clock at authorization; the ~7-day hold constraint stands.                                                                             |
| Per-listing monetization & fee amounts     | `AccommodationsSystemDesign.md` §8 | Flow A implements `listing_fee` listings' payments; flow B/C implement `booking_fee` listings' collection (pointer there cites §5 here for payouts). |
| `published`-only bookability (A1)          | `AccommodationsSystemDesign.md` §1 | Re-checked in the §3 webhook before any capture.                                                                                                     |
| Reservation page is live; guest vocabulary | `GuestSystemDesign.md` §3          | §3's dumb redirect page depends on it; `awaiting` renders as "finalizing…".                                                                          |
| Admin flagged-rows surface                 | `AdminPagesSystemDesign.md` §3     | §4/§5 failure flags land in `/admin/bookings` filters.                                                                                               |

## 11. Defined behaviors (the no-surprises ledger)

| Situation                                                         | Defined behavior                                                                                                                                                   |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Guest closes the checkout tab                                     | Row sits `awaiting`, invisible; reaper deletes at deadline. Guest saw no promise, gets no email.                                                                   |
| Guest pays; host never responds                                   | Cron auto-declines at 48h → hold released — guest was never charged, told so in the email.                                                                         |
| Guest pays; dates got confirmed to someone else mid-checkout      | Webhook releases the hold, books nothing, `auto_declined` + "you were not charged" (§3).                                                                           |
| Host confirms; capture fails                                      | Confirm fails whole; booking stays `pending`; host told to have the guest rebook (§3).                                                                             |
| Instant listing; capture fails in the webhook                     | Degrades to the request flow: `authorized` + 48h clock + request emails + `capture_failed` flag — the hold is still good, so the booking survives (§3).            |
| Host never completes payout onboarding                            | Earnings hold indefinitely as `held`; the stage-3 card waits; nothing expires (§2).                                                                                |
| Stage-2 silent account creation fails                             | Toggle still succeeds; account creation retries at stage 3 when the card needs the onboarding link.                                                                |
| Refund API fails                                                  | State unchanged + admin flag; human completes; reconciliation cron re-surfaces if forgotten (§4, §6).                                                              |
| Transfer fails (closed bank account)                              | Row stays `held` + flag; provider's remediation surface handles the host side; sweep resumes after clear.                                                          |
| Webhook delivered twice / out of order                            | Idempotent handlers keyed on refs; no-op (§6).                                                                                                                     |
| Late-cancelled paid booking                                       | Stays `paid`; earnings row stays owed; transfers on the normal sweep — the host's compensation (§4, §5).                                                           |
| Admin cancels a `checked_in` stay (emergency brake)               | Full refund still possible — transfer hasn't happened (terminal-only trigger). The invariant at work (§5).                                                         |
| Platform fee on a refunded booking                                | Refunded with the total — the platform never keeps fees on unstayed stays (§4).                                                                                    |
| Guest pays online for a listing whose host is cash-only next door | Impossible — listing forms can't offer `online` while `ONLINE_PAYMENTS_AVAILABLE` is false (provider unwired OR Phase 2 not shipped), and per-listing `paymentMethod` gates the form (§8, `AccommodationsSystemDesign.md` §6). |

## 12. Considered and rejected

- **Destination charges** — rejected (§1): documented as wrong for hold-and-release, and
  they couple guest checkout to host account state, breaking §0.2.
- **Direct charges / host-as-merchant-of-record** — rejected: that's the SaaS pattern for
  sellers running independent businesses; this platform owns checkout, pricing, and the
  guest relationship.
- **Onboarding at signup or listing creation** — rejected with prejudice (§0.1, §2). The
  entire stage design exists to make this impossible to drift back into.
- **Fully white-label onboarding (`dashboard: "none"` / API-built KYC)** — rejected:
  building remediation, dispute, and payout UX by hand for a Belgrade-scale platform is
  pure liability. Provider-hosted onboarding IS the product's psychology (§2).
- **Airbnb-style payout at check-in +24h** — deferred behind `PAYOUT_TRIGGER` with a
  written warning (§5, §8): it requires a clawback design this system deliberately lacks.
- **Instant payouts** — rejected; a paid add-on for a need no host has expressed.
- **Partial refunds / refund tiers** — rejected here because rejected in the policy
  (`BookingSystemDesign.md` §4); the money side stays full-or-nothing.
- **Saved cards / card-on-file** — rejected for v1; every stay is a fresh checkout.
  (Setup-intent territory if rebooking friction ever proves real.)
- **Provider Billing/subscriptions for the listing fee** — rejected: one-off charges on a
  90-day cycle are simpler than subscription state sync, and renewal UX is already
  designed (`AccommodationsSystemDesign.md` §8).
- **Processed-events table for webhook dedup** — rejected until idempotent handlers
  measurably fail (§6); state-targeted writes make duplicates no-ops for free.

## 13. Delta / implementation order

1. **Schema + config**: `paymentStatus` value set (+ migration mapping per
   `BookingSystemDesign.md` §12.1), `paymentDeadlineAt`, `bookingEarnings`,
   `hostPayoutAccounts`, earnings aggregate + backfill, `PAYMENTS_CONFIG` (`PROVIDER:
'none'`). All inert.
2. **Adapter skeleton** (§7) with typed no-op implementations — mutations wire to it now;
   `'none'` throws on reach (unreachable while listings can't offer `online`).
3. **Checkout flow** (§3): `createBooking` online branch, webhook endpoint, reaper in the
   lifecycle cron, capture in `confirmBooking`. Ships dark behind `BOOKING_FEE_ENABLED:
   false` — the listing fee (StripeTODO §1–§8) shipped first and is unaffected.
4. **Refund/release wiring** (§4) into the existing cancel/decline/withdraw mutations.
5. **Onboarding stages** (§2): stage-2 silent creation on the listing toggle, stage-3
   card + email, account webhooks → `hostPayoutAccounts`.
6. **Payout sweep + reconciliation crons** (§5, §6) + admin flag filters.
7. **Stripe implementation** of the adapter (§7 reference notes), sandbox end-to-end, THEN
   `PROVIDER: 'stripe'` — done (the listing-fee go-live, StripeTODO §8). The guest-side
   surfaces stay dark behind `BOOKING_FEE_ENABLED: false` until the Phase-2 build
   (StripeTODO §9–§10) flips it — that flip IS the Phase-2 launch. The §7 jurisdiction
   check remains part of that go-live gate.

Steps 1–6 are provider-independent and shippable dark, in order, today. Step 7 is the only
one that touches Stripe, and flipping the config constant is the launch.

## § FOR LLMs / AI ASSISTANTS — READ BEFORE TOUCHING MONEY CODE

1. **No provider SDK outside the adapter file** (§7). A `stripe.` call in a booking
   mutation is a bug regardless of whether it works.
2. **No payment state from redirects** (§0.3, §6). If you're writing `paymentStatus` in a
   `+page` load or a return-URL handler, stop — that write belongs to a webhook handler.
3. **Never ask a host for financial details outside stage 3's card** (§2). No new
   "complete your payout setup" prompts, modals, or gates anywhere else — the stage table
   is the complete list of asks.
4. **The §4 matrix is closed.** A refund path not in the table doesn't exist; add a row to
   the design before adding a branch to the code. Same for §5's three-condition transfer
   rule — especially: never transfer on a non-terminal booking.
5. **`application_fee_amount` must not appear in this codebase** (§7) — fees are
   transfer-math. And host payability is the v2 capability path, never
   `payouts_enabled`.
6. **Failures flag, they don't loop** (§0, §4–§6): the pattern is "state unchanged + admin
   flag + reconciliation re-surface". Do not add retry queues, backoff loops, or saga
   states.
7. **Amounts come from snapshots** (booking price block, earnings row) — never recomputed
   from live listing prices or live fee config at money time.
8. **When uncertain, say so in your summary** with the section, e.g. "held payout at
   terminal per PaymentsSystemDesign.md §5; say the word if check-in payout got
   prioritized — it needs the clawback design first."
