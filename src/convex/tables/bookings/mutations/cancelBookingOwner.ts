// LIBRARIES
import { v } from 'convex/values';

// UTILS
import { authMutation } from '@/convex/auth/middleware/authMiddleware';
import { analytics, ANALYTICS_EVENT, hostAnalyticsScope } from '@/convex/analytics';
import { sendBookingCancelledEmail } from '@/convex/email/sendBookingCancelledEmail';
import { applyHostAction } from '@/shared/features/booking/utils/applyHostAction';
import { hostMayPerform } from '@/shared/features/booking/utils/hostMayPerform';

// SCHEMAS
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

/** Host cancels a confirmed booking they own. */
export const cancelBookingOwner = authMutation('cancelBookingOwner')({
	args: {
		bookingId: v.id('bookings'),
		locale: v.optional(v.string())
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const booking = await ctx.db.get(args.bookingId);
		if (!booking || booking.hostId !== ctx.userId) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}
		if (!hostMayPerform('cancel', booking)) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		const patch = applyHostAction(booking, 'cancel');
		if (!patch) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		await ctx.db.patch(args.bookingId, patch);

		// Hosts can only cancel confirmed bookings (see hostMayPerform), so this
		// always reverses GMV that booking.confirmed previously added.
		await analytics.track(ctx, ANALYTICS_EVENT.BOOKING_CANCELLED, {
			actorId: ctx.userId,
			scopes: [hostAnalyticsScope(booking.hostId)],
			properties: { totalEuros: booking.total, cancelledBy: 'host' }
		});

		const apartment = booking.apartmentId ? await ctx.db.get(booking.apartmentId) : null;
		const apartmentTitle = apartment?.title ?? booking.apartmentSlug;

		await sendBookingCancelledEmail(ctx, {
			locale: args.locale ?? 'en',
			bookingCode: booking.bookingCode,
			guestFirstName: booking.guestFirstName,
			guestEmail: booking.guestEmail,
			apartmentTitle,
			checkInDate: booking.checkInDate,
			checkOutDate: booking.checkOutDate
		});

		return { success: true, message: { key: 'GenericMessages.BOOKING_UPDATED' } };
	}
});
