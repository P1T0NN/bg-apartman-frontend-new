// LIBRARIES
import { httpAction } from '@/convex/_generated/server';

// UTILS
import { internal } from '@/convex/_generated/api';
import { paymentsAdapter, onlinePaymentsEnabled } from '@/convex/payments/adapter';

// TYPES
import type { Id } from '@/convex/_generated/dataModel';

/**
 * THE payment webhook — one endpoint, signature-verified, secret in env
 * (PaymentsSystemDesign.md §6). Registered in `convex/http.ts`.
 *
 * Webhooks are the only truth (§0.3): no payment state is ever written from a client
 * redirect, a success page, or an optimistic assumption. The guest-facing gap is covered
 * by the live reservation page, which flips the moment a handler below lands.
 *
 * This action owns the PROVIDER CALLS (release, capture); the mutations it drives own the
 * writes. That order is deliberate — money moves first, then we record that it moved, so a
 * failed call can never leave a row claiming something that didn't happen.
 *
 * Everything not in the switch: 200 and ignore. Signature failure: 400 with no body — the
 * provider retries, and an unverified payload never reaches a mutation.
 */
export const paymentsWebhook = httpAction(async (ctx, request) => {
	// Dark-ship gate: with no provider wired there is nothing that can legitimately post
	// here, and `verifyWebhook` would throw anyway. Answer 404 rather than leak the route.
	if (!onlinePaymentsEnabled()) return new Response(null, { status: 404 });

	let event;
	try {
		event = await paymentsAdapter.verifyWebhook(request);
	} catch {
		return new Response(null, { status: 400 });
	}

	switch (event.type) {
		case 'authorization_confirmed': {
			// The adapter speaks in plain strings — it has no business knowing Convex ids.
			const bookingId = event.bookingId as Id<'bookings'>;
			const { paymentRef } = event;

			const verdict = await ctx.runMutation(internal.payments.webhookMutations.applyAuthorization, {
				bookingId,
				paymentRef
			});

			if (verdict === 'lost_race') {
				// The guest finished a real flow for dates that are gone. Release first —
				// "you were not charged" has to be true before we send it.
				const released = await runProviderOp(() => paymentsAdapter.release(paymentRef));
				await ctx.runMutation(internal.payments.webhookMutations.finalizeLostRace, {
					bookingId,
					released
				});
			} else if (verdict === 'capture') {
				// Instant listing: capture, then confirm. A failure degrades to the request
				// flow rather than losing the booking (see `finalizeCapture`).
				const captured = await runProviderOp(() => paymentsAdapter.capture(paymentRef));
				await ctx.runMutation(internal.payments.webhookMutations.finalizeCapture, {
					bookingId,
					captured
				});
			}
			break;
		}

		case 'capture_succeeded':
			await ctx.runMutation(internal.payments.webhookMutations.applyCaptureConfirmed, {
				paymentRef: event.paymentRef
			});
			break;

		case 'refund_succeeded':
			await ctx.runMutation(internal.payments.webhookMutations.applyRefundConfirmed, {
				paymentRef: event.paymentRef
			});
			break;

		case 'account_capability_changed':
			await ctx.runMutation(internal.payments.webhookMutations.applyAccountCapability, {
				providerAccountId: event.providerAccountId,
				transfersActive: event.transfersActive
			});
			break;

		case 'transfer_result':
			await ctx.runMutation(internal.payments.webhookMutations.applyTransferResult, {
				transferRef: event.transferRef,
				succeeded: event.succeeded
			});
			break;

		case 'ignored':
			break;
	}

	return new Response(null, { status: 200 });
});

/** Run one provider call, reporting success as a boolean. Failures flag, they don't throw. */
async function runProviderOp(op: () => Promise<void>): Promise<boolean> {
	try {
		await op();
		return true;
	} catch (error) {
		console.error('[paymentsWebhook] provider call failed', error);
		return false;
	}
}
