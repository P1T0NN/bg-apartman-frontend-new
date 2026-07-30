// UTILS
import { zAuthMutation } from '@/convex/auth/middleware/authMiddleware';
import { authComponent } from '@/convex/auth/auth';
import { analytics, ANALYTICS_EVENT, hostAnalyticsScope } from '@/convex/analytics';
import { trackBookingNights } from '@/convex/tables/bookings/helpers/trackBookingNights';
import { sendBookingCancelledEmail } from '@/convex/email/sendBookingCancelledEmail';
import { sendBookingCancelledHostEmail } from '@/convex/email/sendBookingCancelledHostEmail';
import { applyHostAction } from '@/shared/features/booking/utils/applyHostAction';
import { hostMayPerform } from '@/shared/features/booking/utils/hostMayPerform';
import {
	settleBookingPayment,
	paymentNoteFrom
} from '@/convex/payments/helpers/settleBookingPayment';

// SCHEMAS
import { cancelBookingOwnerSchema } from '@/shared/features/booking/schemas/bookingsSchemas';
import type { MutationResult } from '@/convex/schemas/schemas';

/** Host cancels a confirmed booking they own, with a mandatory reason the guest reads. */
export const cancelBookingOwner = zAuthMutation('cancelBookingOwner')({
	// The whole shared schema IS the args — no parallel v.* block (zAuthMutation pattern).
	args: cancelBookingOwnerSchema,
	handler: async (ctx, args): Promise<MutationResult> => {
		const booking = await ctx.db.get(args.bookingId);
		if (!booking || booking.hostId !== ctx.userId) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}
		if (!hostMayPerform('cancel', booking)) {
			// Tell the host why, not just "no": online inside the window is closed for good;
			// cash inside the window unlocks via a provably ignored stay confirmation (§11).
			if (booking.status !== 'confirmed') {
				return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
			}
			return booking.paymentMethod === 'online'
				? { success: false, message: { key: 'GenericMessages.HOST_CANCEL_WINDOW_CLOSED' } }
				: { success: false, message: { key: 'GenericMessages.HOST_CANCEL_NEEDS_CONFIRMATION' } };
		}

		const patch = applyHostAction(booking, 'cancel');
		if (!patch) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		// A host cancel is ALWAYS a full refund / release — never the late-cancel keep, which
		// exists only to compensate the host for a guest's late change of plans (§4).
		const settlement = await settleBookingPayment(ctx, booking);

		// The host's own words replace the generic transition reason — the guest reads them
		// in the email and on the reservation page (same overwrite pattern as declineBooking).
		await ctx.db.patch(args.bookingId, {
			...patch,
			...settlement,
			cancelReason: args.cancelReason // already trimmed by cancelBookingOwnerSchema
		});

		// Hosts can only cancel confirmed bookings (see hostMayPerform), so this
		// always reverses GMV that booking.confirmed previously added.
		await analytics.track(ctx, ANALYTICS_EVENT.BOOKING_CANCELLED, {
			actorId: ctx.userId,
			scopes: [hostAnalyticsScope(booking.hostId)],
			properties: { totalEuros: booking.total, cancelledBy: 'host' }
		});
		// Same reversal for occupancy — balances the `booked` events from confirmation.
		await trackBookingNights(ctx, booking, 'released');

		const apartment = booking.apartmentId ? await ctx.db.get(booking.apartmentId) : null;
		const apartmentTitle = apartment?.title ?? booking.apartmentSlug;

		await sendBookingCancelledEmail(ctx, {
			locale: args.locale ?? 'en',
			bookingCode: booking.bookingCode,
			guestFirstName: booking.guestFirstName,
			guestEmail: booking.guestEmail,
			apartmentTitle,
			checkInDate: booking.checkInDate,
			checkOutDate: booking.checkOutDate,
			cancelReason: args.cancelReason,
			// A host cancel always refunds/releases in full (§4) — tell the guest which.
			paymentNote: paymentNoteFrom(settlement, booking)
		});

		// Receipt of their own action, so the host's inbox carries the evidence trail
		// (BookingSystemDesign.md §8's host column).
		const host = await authComponent.getAnyUserById(ctx, booking.hostId);
		const hostEmail = host?.email?.trim();
		if (hostEmail) {
			await sendBookingCancelledHostEmail(ctx, {
				locale: 'en',
				bookingId: args.bookingId,
				bookingCode: booking.bookingCode,
				guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
				hostName: host?.name?.trim() || 'Host',
				hostEmail,
				apartmentTitle,
				checkInDate: booking.checkInDate,
				checkOutDate: booking.checkOutDate,
				cancelReason: args.cancelReason,
				cancelledBy: 'host'
			});
		}

		return { success: true, message: { key: 'GenericMessages.BOOKING_UPDATED' } };
	}
});
