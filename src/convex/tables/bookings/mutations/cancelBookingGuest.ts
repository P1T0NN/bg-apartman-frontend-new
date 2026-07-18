// LIBRARIES
import { v } from 'convex/values';
import { mutation } from '@/convex/_generated/server';

// UTILS
import { analytics, ANALYTICS_EVENT, hostAnalyticsScope } from '@/convex/analytics';
import { sendBookingCancelledEmail } from '@/convex/email/sendBookingCancelledEmail';
import { applyGuestAction } from '@/shared/features/booking/utils/applyGuestAction';
import { guestMayPerform } from '@/shared/features/booking/utils/guestMayPerform';
import { guestMayCancelConfirmed } from '@/shared/features/booking/utils/guestMayCancelConfirmedBooking';
import { todayIsoUtc } from '@/shared/features/booking/utils/daysUntilCheckIn';

// SCHEMAS
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

/**
 * Guest cancels a confirmed booking (7+ days before check-in).
 *
 * No account required — the booking id is the unguessable capability token, same as
 * {@link fetchBookingById}.
 */
export const cancelBookingGuest = mutation({
	args: {
		bookingId: v.id('bookings'),
		locale: v.optional(v.string())
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const booking = await ctx.db.get(args.bookingId);
		if (!booking) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		if (
			booking.status === 'confirmed' &&
			!guestMayCancelConfirmed(booking.checkInDate, todayIsoUtc())
		) {
			return { success: false, message: { key: 'GenericMessages.BOOKING_CANCEL_TOO_LATE' } };
		}

		if (!guestMayPerform('cancel', booking)) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		const patch = applyGuestAction(booking, 'cancel');
		if (!patch) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		await ctx.db.patch(args.bookingId, patch);

		// Guests can only cancel confirmed bookings (see guestMayPerform), so this
		// always reverses GMV that booking.confirmed previously added.
		await analytics.track(ctx, ANALYTICS_EVENT.BOOKING_CANCELLED, {
			scopes: [hostAnalyticsScope(booking.hostId)],
			properties: { totalEuros: booking.total, cancelledBy: 'guest' }
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
