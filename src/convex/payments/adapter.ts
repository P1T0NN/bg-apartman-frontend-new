// CONFIG
import { PAYMENTS_CONFIG } from '@/shared/config';

/**
 * The provider seam — ONE file owns the payment provider (PaymentsSystemDesign.md §7).
 *
 * Booking, listing and payout code calls these names and never a provider SDK. A
 * `stripe.` call anywhere else is a bug regardless of whether it works (§ FOR LLMs 1).
 * Swapping providers is this file, not a redesign; a bank-API implementation of
 * `charge()` alone is enough to run `listing_fee` mode with no Connect at all.
 *
 * `PROVIDER: 'none'` throws on every op. That is not a gap — it is the dark-ship gate:
 * listings cannot offer `online` while `'none'` (see `onlinePaymentsEnabled`), so no call
 * site is reachable. Every caller either sits behind that gate or already treats a throw
 * as its documented failure path (§11's ledger — e.g. stage-2 account creation retries at
 * stage 3).
 *
 * IMPLEMENTATION NOTE for the Stripe step (PaymentsSystemDesign.md §13.7): these ops do
 * network I/O, which Convex allows only in actions. Under `'none'` every call throws
 * before any I/O, so today's mutation call sites are correct as written. Wiring a real
 * provider means promoting the call sites that must be synchronous with money
 * (`confirmBooking`'s capture) to actions — the webhook, checkout, sweep and
 * reconciliation entry points are already actions.
 */

/** Whatever we hand the provider for its own records. Machine-facing, never displayed. */
export type PaymentMeta = Record<string, string>;

export type CreateCheckoutInput = {
	bookingId: string;
	/** Whole euros — from the booking's price snapshot, never recomputed (§ FOR LLMs 7). */
	amountEur: number;
	guestEmail: string;
	/** Where the provider sends the guest back. The page is dumb by design (§0.3, §3). */
	returnUrl: string;
};

export type RecipientAccountInput = {
	hostId: string;
	email: string;
	/** ISO 3166-1 alpha-2. */
	country: string;
};

/**
 * What the reconciliation sweep (§6) reads back from the provider. Deliberately the
 * smallest shape that answers "does provider truth match our row?".
 */
export type ProviderPaymentState = 'authorized' | 'captured' | 'released' | 'refunded' | 'unknown';

/**
 * Webhook events the endpoint handles (§6). Everything else is `ignored` — the endpoint
 * 200s and does nothing. Handlers key on object refs, never on event sequence, so
 * duplicate and out-of-order deliveries are harmless.
 */
export type PaymentWebhookEvent =
	| { type: 'authorization_confirmed'; bookingId: string; paymentRef: string }
	| { type: 'capture_succeeded'; paymentRef: string }
	| { type: 'refund_succeeded'; paymentRef: string }
	| { type: 'account_capability_changed'; providerAccountId: string; transfersActive: boolean }
	| { type: 'transfer_result'; transferRef: string; succeeded: boolean }
	| { type: 'ignored' };

export type PaymentsAdapter = {
	/** Flow A — one-time listing-fee charge. No Connect, no payout machinery (§1). */
	charge(amountEur: number, meta: PaymentMeta): Promise<string>;
	/** Flow B — provider-hosted checkout with MANUAL capture. Returns the redirect URL. */
	createCheckout(input: CreateCheckoutInput): Promise<string>;
	capture(paymentRef: string): Promise<void>;
	release(paymentRef: string): Promise<void>;
	/** Always full — the policy has no partial tiers, so the money side has none (§4). */
	refund(paymentRef: string): Promise<void>;
	/** Stage 2 — silent, minimal fields, no host-facing form (§2). */
	createRecipientAccount(input: RecipientAccountInput): Promise<string>;
	/** Stage 3 — the one button on the earnings card. Provider-hosted flow (§2). */
	onboardingLink(providerAccountId: string): Promise<string>;
	/**
	 * Flow C — platform → host. Fees are transfer-math (transfer less than gross); an
	 * `application_fee_amount` anywhere in this codebase is a bug (§7, § FOR LLMs 5).
	 */
	transfer(netEur: number, providerAccountId: string, meta: PaymentMeta): Promise<string>;
	/** §6's endpoint uses ONLY this — signature verification lives with the provider. */
	verifyWebhook(request: Request): Promise<PaymentWebhookEvent>;
	/** §6's reconciliation read: provider truth for one payment, to compare against our row. */
	fetchPaymentState(paymentRef: string): Promise<ProviderPaymentState>;
};

const notWired = (op: string) => (): never => {
	throw new Error(
		`payments adapter: ${op}() called with PAYMENTS_CONFIG.PROVIDER='none'. ` +
			'Online payments are gated off — see PaymentsSystemDesign.md §7/§8.'
	);
};

/**
 * The no-op implementation. Typed against the full contract so every call site compiles
 * and is exercised by `svelte-check` today; reaching one at runtime is a bug in the gate,
 * and the throw says so loudly rather than silently pretending money moved.
 */
const noneAdapter: PaymentsAdapter = {
	charge: notWired('charge'),
	createCheckout: notWired('createCheckout'),
	capture: notWired('capture'),
	release: notWired('release'),
	refund: notWired('refund'),
	createRecipientAccount: notWired('createRecipientAccount'),
	onboardingLink: notWired('onboardingLink'),
	transfer: notWired('transfer'),
	verifyWebhook: notWired('verifyWebhook'),
	fetchPaymentState: notWired('fetchPaymentState')
};

/**
 * The adapter every caller imports. Selection is a config constant, not a runtime
 * lookup — swapping providers is a deploy (PaymentsSystemDesign.md §8).
 */
export const paymentsAdapter: PaymentsAdapter = noneAdapter;

/**
 * The gate. `true` only when a provider implementation is wired and verified — listing
 * forms may offer `online`, `createBooking` may take the online branch, and the payment
 * crons do real work. Read this instead of comparing `PROVIDER` inline, so flipping the
 * constant is the only edit the launch needs.
 */
export const onlinePaymentsEnabled = (): boolean => PAYMENTS_CONFIG.PROVIDER !== 'none';
