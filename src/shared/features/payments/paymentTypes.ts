import type Stripe from 'stripe';

/**
 * The one Stripe type shared code may name — a signature-verified webhook event.
 * Type-only import: erased at build time, so nothing of the SDK reaches client bundles.
 */
export type StripeWebhookEvent = Stripe.Event;

/** Input to {@link PaymentAdapter.createListingFeeCheckout} — the host pays the listing fee. */
export type CreateListingFeeCheckoutInput = {
	amountEur: number;
	apartmentId: string;
	title: string;
	successUrl: string;
	cancelUrl: string;
	/** Surfaced back on the webhook event (session metadata) for the published email. */
	locale: string;
};

export type CreateListingFeeCheckoutResult = {
	sessionId: string;
	url: string;
	expiresAt: number;
};

/**
 * Provider boundary (PaymentsSystemDesign.md §7). Every payment call in the app routes
 * through this interface; the concrete implementation lives in `src/convex/payments/`.
 * Shared code only ever sees this contract — nothing imports the provider SDK directly.
 */
export type PaymentAdapter = {
	createListingFeeCheckout(input: CreateListingFeeCheckoutInput): Promise<CreateListingFeeCheckoutResult>;
	/** Re-read a session (the live-session guard reuses its URL on a double-open). */
	retrieveCheckoutSession(sessionId: string): Promise<{ url: string | null; expiresAt: number | null }>;
	refund(paymentRef: string, idempotencyKey: string): Promise<void>;
	verifyWebhook(body: string, signature: string): Promise<StripeWebhookEvent>;
};
