// LIBRARIES
import { httpAction } from '@/convex/_generated/server';
import { internal } from '@/convex/_generated/api';

// ADAPTER
import { getPaymentAdapter } from '@/convex/payments/adapter';

// TYPES
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Stripe webhook — registered at `/stripe/webhook` (StripeTODO §6b).
 *
 * Deliberately a thin pass-through: signature-verify, switch on the event, forward. No
 * `ctx.db` writes, no email, no audit, no analytics here — http actions can't audit or
 * emit safely, and a redelivered webhook would double-fire. Every side effect lives in the
 * idempotent internal mutations.
 *
 * - Signature mismatch → `401`: Stripe logs the failure and retries. Do NOT swallow.
 * - `checkout.session.completed` → `stampListingFeePayment` (the money event).
 * - `checkout.session.expired` → `clearExpiredCheckout` (forget the dead session).
 * - Anything else → `200`: unhandled events are a no-op, not an error.
 */
export const stripeWebhook = httpAction(async (ctx, request) => {
	const signature = request.headers.get('stripe-signature');
	if (!signature) {
		return new Response('missing signature', { status: 401 });
	}

	const body = await request.text();

	let event;
	try {
		event = await getPaymentAdapter().verifyWebhook(body, signature);
	} catch {
		// Bad signature, or PAYMENTS_DISABLED / STRIPE_NOT_CONFIGURED — either way we cannot
		// trust this event, so Stripe's retry+log loop is the right behavior.
		return new Response('webhook verification failed', { status: 401 });
	}

	switch (event.type) {
		case 'checkout.session.completed': {
			const session = event.data.object;
			const apartmentId = session.client_reference_id;
			const paymentIntent =
				typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
			if (!apartmentId || !paymentIntent || session.amount_total === null || session.currency === null) {
				// Incomplete session: nothing to correlate. 400 stops the retry storm and
				// surfaces the failure in Stripe's dashboard for a human to inspect.
				return new Response('incomplete checkout session', { status: 400 });
			}

			await ctx.runMutation(
				internal.tables.accommodations.mutations.stampListingFeePayment.stampListingFeePayment,
				{
					apartmentId: apartmentId as Id<'apartments'>,
					paymentRef: paymentIntent,
					amountTotal: session.amount_total,
					currency: session.currency,
					// Rode back on the session metadata the action set at create time.
					locale: session.metadata?.locale ?? 'en'
				}
			);
			return new Response('ok', { status: 200 });
		}

		case 'checkout.session.expired': {
			const session = event.data.object;
			const apartmentId = session.client_reference_id;
			if (!apartmentId) {
				return new Response('incomplete checkout session', { status: 400 });
			}

			await ctx.runMutation(
				internal.tables.accommodations.mutations.clearExpiredCheckout.clearExpiredCheckout,
				{
					apartmentId: apartmentId as Id<'apartments'>,
					sessionId: session.id
				}
			);
			return new Response('ok', { status: 200 });
		}

		default:
			// Unhandled events (charge.*, invoice.*, …) are a no-op — acknowledge and move on.
			return new Response('unhandled event type', { status: 200 });
	}
});
