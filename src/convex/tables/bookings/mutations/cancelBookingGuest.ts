// LIBRARIES
import { v } from 'convex/values';
import { mutation } from '@/convex/functions';

// UTILS
import { authComponent } from '@/convex/auth/auth';
import { recordGmv, recordNights } from '@/convex/analytics';
import { sendBookingCancelledEmail } from '@/convex/email/sendBookingCancelledEmail';
import { sendBookingCancelledHostEmail } from '@/convex/email/sendBookingCancelledHostEmail';
import { applyGuestAction } from '@/shared/features/booking/utils/applyGuestAction';

// SCHEMAS
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

/**
 * Guest cancels a confirmed booking, allowed until the day before check-in.
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

		// One gate, shared with the UI: cancellable until the day before check-in. Inside the
		// free window it is allowed but stamped `lateCancellation` by `applyGuestAction`
		// (BookingSystemDesign.md §4) — the window is read from the booking's own policy
		// snapshot, never live config.
		const patch = applyGuestAction(booking, 'cancel');
		if (!patch) {
			return { success: false, message: { key: 'GenericMessages.BOOKING_CANCEL_TOO_LATE' } };
		}

		await ctx.db.patch(args.bookingId, { ...patch });

		// Guests can only cancel confirmed bookings (see guestMayPerform), so this
		// always reverses GMV that booking.confirmed previously added.
		await recordGmv(ctx, booking, 'cancelled');
		// Same reversal for occupancy — balances the `booked` rollups from confirmation.
		await recordNights(ctx, booking, 'released');

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

		// The host's side of the same event: their dates are free again
		// (BookingSystemDesign.md §8's host column).
		const host = await authComponent.getAnyUserById(ctx, booking.hostId);
		const hostEmail = host?.email?.trim();
		if (hostEmail) {
			await sendBookingCancelledHostEmail(ctx, {
				// No per-host locale is stored; host emails default to English.
				locale: 'en',
				bookingId: args.bookingId,
				bookingCode: booking.bookingCode,
				guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
				hostName: host?.name?.trim() || 'Host',
				hostEmail,
				apartmentTitle,
				checkInDate: booking.checkInDate,
				checkOutDate: booking.checkOutDate,
				cancelledBy: 'guest'
			});
		}

		return { success: true, message: { key: 'GenericMessages.BOOKING_UPDATED' } };
	}
});
