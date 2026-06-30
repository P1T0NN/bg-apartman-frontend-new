import { v } from 'convex/values';
import { mutation } from '@/convex/_generated/server';

// UTILS
import { sendBookingCancelledEmail } from '@/convex/email/sendBookingCancelledEmail';
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';
import { applyGuestAction } from '@/shared/features/booking/utils/applyGuestAction';
import { guestMayPerform } from '@/shared/features/booking/utils/guestMayPerform';
import { guestMayCancelConfirmed } from '@/shared/features/booking/utils/guestMayCancelConfirmedBooking';
import { todayIsoUtc } from '@/shared/features/booking/utils/daysUntilCheckIn';

// TYPES
import type { typesGuestBookingAction } from '@/shared/features/booking/types/bookingTypes';

const forbiddenResult = (): MutationResult => ({
	success: false,
	message: { key: 'GenericMessages.FORBIDDEN' }
});

const cancelTooLateResult = (): MutationResult => ({
	success: false,
	message: { key: 'GenericMessages.BOOKING_CANCEL_TOO_LATE' }
});

/**
 * Guest-side booking actions on `/reservations/[id]` (and later My bookings).
 *
 * No account required — the booking id is the unguessable capability token, same as
 * {@link fetchBookingById}. Logged-in guests could get a stricter variant later.
 */
export const performGuestBookingAction = mutation({
	args: {
		bookingId: v.id('bookings'),
		action: v.union(v.literal('withdraw'), v.literal('cancel')),
		locale: v.optional(v.string())
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const booking = await ctx.db.get(args.bookingId);
		if (!booking) return forbiddenResult();

		if (args.action === 'cancel' && booking.status === 'confirmed') {
			const today = todayIsoUtc();
			if (!guestMayCancelConfirmed(booking.checkInDate, today)) {
				return cancelTooLateResult();
			}
		}

		if (!guestMayPerform(args.action as typesGuestBookingAction, booking)) {
			return forbiddenResult();
		}

		const patch = applyGuestAction(booking, args.action as typesGuestBookingAction);
		if (!patch) return forbiddenResult();

		await ctx.db.patch(args.bookingId, patch);

		const apartment = booking.apartmentId ? await ctx.db.get(booking.apartmentId) : null;

		await sendBookingCancelledEmail(ctx, {
			locale: args.locale ?? 'en',
			bookingCode: booking.bookingCode,
			guestFirstName: booking.guestFirstName,
			guestEmail: booking.guestEmail,
			apartmentTitle: apartment?.title ?? booking.apartmentSlug,
			checkInDate: booking.checkInDate,
			checkOutDate: booking.checkOutDate
		});

		return { success: true, message: { key: 'GenericMessages.BOOKING_UPDATED' } };
	}
});
