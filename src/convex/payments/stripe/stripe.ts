// LIBRARIES
import Stripe from 'stripe';
import { ConvexError } from 'convex/values';

// TYPES
import type { PaymentAdapter } from '@/shared/features/payments/paymentTypes';

let client: Stripe | null = null;

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

/** `integration_identifier` suffix — arbitrary, just needs to vary per session. */
function randomLetters(n: number): string {
	let out = '';
	for (let i = 0; i < n; i++) out += LETTERS[(Math.random() * 26) | 0];
	return out;
}

/**
 * Lazy singleton Stripe client — the only place the SDK is constructed. Every provider
 * call in the app routes through here (PaymentsSystemDesign.md §7 adapter boundary: no
 * provider SDK outside `src/convex/payments/`).
 *
 * Key is a restricted API key (`rk_`) in `STRIPE_SECRET_KEY`. Until it is set for the
 * deployment, any call throws `STRIPE_NOT_CONFIGURED` up front instead of failing deep
 * inside a Stripe call with an unhelpful auth error.
 */
export function getStripe(): Stripe {
	if (!client && process.env.STRIPE_SECRET_KEY) {
		client = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-07-29.dahlia' });
	}
	if (!client) {
		throw new ConvexError({ code: 'STRIPE_NOT_CONFIGURED' });
	}
	return client;
}

/**
 * The Stripe implementation of {@link PaymentAdapter} — the listing-fee slice only.
 * `capture`/`release`/`transfer`/`payout` land in Phase 2 (StripeTODO §9).
 * ponytail: booking-fee payouts land in Phase 2; add the stubs then, not now.
 */
export const stripeAdapter: PaymentAdapter = {
	async createListingFeeCheckout({ amountEur, apartmentId, title, successUrl, cancelUrl, locale }) {
		const session = await getStripe().checkout.sessions.create({
			mode: 'payment', // one-time, automatic capture — the listing fee is paid up front
			line_items: [
				{
					quantity: 1,
					price_data: {
						currency: 'eur',
						unit_amount: Math.round(amountEur * 100),
						product_data: { name: title }
					}
				}
			],
			client_reference_id: apartmentId, // the webhook correlation key
			success_url: successUrl,
			cancel_url: cancelUrl,
			// Locale rides back on the webhook event (session metadata) so the published
			// email that follows payment is in the host's language.
			metadata: { locale },
			// Required on API ≥ 2026-03-25.dahlia; arbitrary 8-letter suffix.
			integration_identifier: `listing_fee_${randomLetters(8)}`
		});
		if (!session.url) {
			throw new ConvexError({ code: 'PAYMENTS_UNEXPECTED_RESPONSE' });
		}
		return { sessionId: session.id, url: session.url, expiresAt: session.expires_at };
	},

	async retrieveCheckoutSession(sessionId) {
		const session = await getStripe().checkout.sessions.retrieve(sessionId);
		return { url: session.url, expiresAt: session.expires_at };
	},

	async refund(paymentRef, idempotencyKey) {
		await getStripe().refunds.create({ payment_intent: paymentRef }, { idempotencyKey });
	},

	async verifyWebhook(body, signature) {
		const secret = process.env.STRIPE_WEBHOOK_SECRET;
		if (!secret) {
			throw new ConvexError({ code: 'STRIPE_NOT_CONFIGURED' });
		}
		return getStripe().webhooks.constructEventAsync(body, signature, secret);
	}
};
