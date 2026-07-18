// LIBRARIES
import { v } from 'convex/values';

// UTILS
import { authMutation } from '@/convex/auth/middleware/authMiddleware';
import { analytics, ANALYTICS_EVENT, hostAnalyticsScope } from '@/convex/analytics';
import { sendBookingConfirmedEmail } from '@/convex/email/sendBookingConfirmedEmail';
import { applyHostAction } from '@/shared/features/booking/utils/applyHostAction';
import { hostMayPerform } from '@/shared/features/booking/utils/hostMayPerform';

// SCHEMAS
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

/** Host confirms a pending booking request. */
export const confirmBooking = authMutation('confirmBooking')({
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
		if (!hostMayPerform('confirm', booking)) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		const patch = applyHostAction(booking, 'confirm');
		if (!patch) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		await ctx.db.patch(args.bookingId, patch);

		await analytics.track(ctx, ANALYTICS_EVENT.BOOKING_CONFIRMED, {
			actorId: ctx.userId,
			scopes: [hostAnalyticsScope(booking.hostId)],
			properties: { totalEuros: booking.total, paymentMethod: booking.paymentMethod }
		});

		const apartment = booking.apartmentId ? await ctx.db.get(booking.apartmentId) : null;
		const apartmentTitle = apartment?.title ?? booking.apartmentSlug;

		await sendBookingConfirmedEmail(ctx, {
			locale: args.locale ?? 'en',
			bookingId: args.bookingId,
			bookingCode: booking.bookingCode,
			guestFirstName: booking.guestFirstName,
			guestEmail: booking.guestEmail,
			apartmentTitle,
			checkInDate: booking.checkInDate,
			checkOutDate: booking.checkOutDate,
			numberOfAdults: booking.numberOfAdults,
			numberOfChildren: booking.numberOfChildren,
			total: booking.total,
			currency: booking.currency
		});

		return { success: true, message: { key: 'GenericMessages.BOOKING_UPDATED' } };
	}
});
