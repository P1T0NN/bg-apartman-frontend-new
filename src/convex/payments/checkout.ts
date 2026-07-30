// LIBRARIES
import { v } from 'convex/values';
import { action, internalQuery } from '@/convex/_generated/server';

// UTILS
import { internal } from '@/convex/_generated/api';
import { paymentsAdapter, onlinePaymentsEnabled } from '@/convex/payments/adapter';
import { reservationUrl } from '@/convex/email/resend';

// SCHEMAS
import { mutationResultData } from '@/convex/schemas/schemas';

/** The booking facts the provider needs. Minimal projection — the adapter gets no db access. */
export const fetchCheckoutContext = internalQuery({
	args: { bookingId: v.id('bookings') },
	handler: async (ctx, args) => {
		const booking = await ctx.db.get(args.bookingId);
		// Only a live checkout may open one. A row that already authorized, or that the
		// reaper is about to take, must not mint a second session.
		if (!booking || booking.paymentStatus !== 'awaiting') return null;
		if (booking.paymentDeadlineAt !== undefined && booking.paymentDeadlineAt <= Date.now()) {
			return null;
		}

		// Amount comes from the booking's frozen price snapshot, never from live listing
		// prices or live fee config (PaymentsSystemDesign.md § FOR LLMs 7).
		return { amountEur: booking.total, guestEmail: booking.guestEmail };
	}
});

/**
 * Open the provider-hosted checkout for an `awaiting` booking (PaymentsSystemDesign.md §3).
 *
 * An action, not a mutation: creating a session is network I/O. It writes NOTHING — the
 * booking row already exists (`createBooking`'s online branch) and every payment state
 * that follows is written by the webhook, never by this call or by the redirect back
 * (§0.3). If this fails or the guest never pays, the row simply reaches its
 * `paymentDeadlineAt` and the reaper deletes it; nobody was ever told anything.
 *
 * The return URL is the live reservation page, which is deliberately dumb: it shows
 * "finalising your payment…" for `awaiting` and flips the moment the webhook lands
 * (GuestSystemDesign.md §3).
 */
export const createCheckoutSession = action({
	args: { bookingId: v.id('bookings') },
	returns: mutationResultData(v.object({ checkoutUrl: v.string() })),
	handler: async (ctx, args) => {
		if (!onlinePaymentsEnabled()) {
			return { success: false, message: { key: 'GenericMessages.PAYMENT_METHOD_NOT_ACCEPTED' } };
		}

		const context = await ctx.runQuery(internal.payments.checkout.fetchCheckoutContext, {
			bookingId: args.bookingId
		});
		if (!context) {
			return { success: false, message: { key: 'GenericMessages.CHECKOUT_EXPIRED' } };
		}

		try {
			const checkoutUrl = await paymentsAdapter.createCheckout({
				bookingId: args.bookingId,
				amountEur: context.amountEur,
				guestEmail: context.guestEmail,
				returnUrl: reservationUrl(args.bookingId)
			});
			return {
				success: true,
				message: { key: 'GenericMessages.CHECKOUT_READY' },
				data: { checkoutUrl }
			};
		} catch {
			return { success: false, message: { key: 'GenericMessages.CHECKOUT_UNAVAILABLE' } };
		}
	}
});
