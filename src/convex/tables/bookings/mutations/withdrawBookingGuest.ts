// LIBRARIES
import { v } from 'convex/values';
import { mutation } from '@/convex/functions';

// UTILS
import { authComponent } from '@/convex/auth/auth';
import { sendBookingWithdrawnEmail } from '@/convex/email/sendBookingWithdrawnEmail';
import { applyGuestAction } from '@/shared/features/booking/utils/applyGuestAction';

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
		// `applyGuestAction` runs the shared guard itself — a null patch IS the rejection.
		const patch = applyGuestAction(booking, 'withdraw');
		if (!patch) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		await ctx.db.patch(args.bookingId, { ...patch });

		// No guest email — they just did this themselves, and a "cancelled" notice would
		// dramatize a non-event. The host gets a polite FYI (BookingSystemDesign.md §8).
		const apartment = await ctx.db.get(booking.apartmentId);
		const host = await authComponent.getAnyUserById(ctx, booking.hostId);
		const hostEmail = host?.email?.trim();

		if (hostEmail) {
			await sendBookingWithdrawnEmail(ctx, {
				// No per-host locale is stored; host emails default to English.
				locale: 'en',
				bookingId: args.bookingId,
				bookingCode: booking.bookingCode,
				guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
				hostName: host?.name?.trim() || 'Host',
				hostEmail,
				apartmentTitle: apartment?.title ?? booking.apartmentSlug,
				checkInDate: booking.checkInDate,
				checkOutDate: booking.checkOutDate
			});
		}

		return { success: true, message: { key: 'GenericMessages.BOOKING_UPDATED' } };
	}
});
