// LIBRARIES
import { v } from 'convex/values';
import { mutation } from '@/convex/_generated/server';

// UTILS
import { sendBookingCancelledEmail } from '@/convex/email/sendBookingCancelledEmail';
import { applyGuestAction } from '@/shared/features/booking/utils/applyGuestAction';
import { guestMayPerform } from '@/shared/features/booking/utils/guestMayPerform';

// SCHEMAS
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

/**
 * Guest withdraws a pending booking request before the host responds.
 *
 * No account required — the booking id is the unguessable capability token, same as
 * {@link fetchBookingById}.
 */
export const withdrawBookingGuest = mutation({
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
		if (!guestMayPerform('withdraw', booking)) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		const patch = applyGuestAction(booking, 'withdraw');
		if (!patch) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		await ctx.db.patch(args.bookingId, patch);

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
