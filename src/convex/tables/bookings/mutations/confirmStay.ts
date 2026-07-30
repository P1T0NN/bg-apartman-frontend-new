// LIBRARIES
import { v } from 'convex/values';
import { mutation } from '@/convex/functions';

// UTILS
import { authComponent } from '@/convex/auth/auth';
import { sendStayConfirmedEmail } from '@/convex/email/sendStayConfirmedEmail';
import { stayConfirmationAnswered } from '@/shared/features/booking/utils/stayConfirmation';

// SCHEMAS
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

/**
 * Guest's one-click "yes, I'm coming" (BookingSystemDesign.md §11).
 *
 * No account required — the booking id is the capability token, same as the reservation
 * page itself. Stamping `stayConfirmedAt` answers the host's request, re-locks the
 * cash-inside-window cancel, and sends the host the closing FYI.
 */
export const confirmStay = mutation({
	args: {
		bookingId: v.id('bookings'),
		locale: v.optional(v.string())
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const booking = await ctx.db.get(args.bookingId);
		if (!booking || booking.status !== 'confirmed') {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		// Double-click / already answered → friendly no-op, not an error.
		if (stayConfirmationAnswered(booking)) {
			return { success: true, message: { key: 'GenericMessages.STAY_CONFIRMED' } };
		}

		const now = Date.now();
		await ctx.db.patch(args.bookingId, { stayConfirmedAt: now, updatedAt: now });

		const host = await authComponent.getAnyUserById(ctx, booking.hostId);
		const hostEmail = host?.email?.trim();
		if (hostEmail) {
			const apartment = await ctx.db.get(booking.apartmentId);
			await sendStayConfirmedEmail(ctx, {
				// No per-host locale is stored; host emails default to English.
				locale: 'en',
				bookingId: args.bookingId,
				bookingCode: booking.bookingCode,
				guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
				hostName: host?.name?.trim() || 'Host',
				hostEmail,
				apartmentTitle: apartment?.title ?? booking.apartmentSlug,
				checkInDate: booking.checkInDate
			});
		}

		return { success: true, message: { key: 'GenericMessages.STAY_CONFIRMED' } };
	}
});
