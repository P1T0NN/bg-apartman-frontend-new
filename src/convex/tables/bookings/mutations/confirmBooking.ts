// LIBRARIES
import { v } from 'convex/values';

// UTILS
import { authMutation } from '@/convex/auth/middleware/authMiddleware';
import { analytics, ANALYTICS_EVENT, recordGmv, recordNights } from '@/convex/analytics';
import { sendBookingConfirmedEmail } from '@/convex/email/sendBookingConfirmedEmail';
import { sendBookingAutoDeclinedEmail } from '@/convex/email/sendBookingAutoDeclinedEmail';
import { applyHostAction } from '@/shared/features/booking/utils/applyHostAction';
import { applyAutoDecline } from '@/shared/features/booking/utils/applyAutoDecline';
import { hostMayPerform } from '@/shared/features/booking/utils/hostMayPerform';

// HELPERS
import { hasAvailabilityConflict } from '@/convex/tables/bookings/helpers/hasAvailabilityConflict';
import { findOverlappingPendingBookings } from '@/convex/tables/bookings/helpers/findOverlappingPendingBookings';

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

		// The listing must still be bookable. A request can outlive its listing being
		// suspended, expired or archived while it sat pending (AccommodationsSystemDesign.md
		// A1) — confirming then would put a guest into a stay the platform has pulled.
		const apartment = await ctx.db.get(booking.apartmentId);
		if (!apartment || apartment.status !== 'published') {
			return { success: false, message: { key: 'GenericMessages.ACCOMMODATION_NOT_BOOKABLE' } };
		}

		// Re-check availability at decision time, not creation time. `pending` blocks
		// nothing, so overlapping requests coexist; whoever is confirmed first wins. Convex
		// mutations are serializable, so this check and the patch below are atomic — a second
		// confirm cannot slip through the gap (BookingSystemDesign.md §6).
		if (
			await hasAvailabilityConflict(
				ctx,
				booking.apartmentId,
				booking.checkInDate,
				booking.checkOutDate
			)
		) {
			return { success: false, message: { key: 'GenericMessages.DATES_UNAVAILABLE' } };
		}

		const patch = applyHostAction(booking, 'confirm');
		if (!patch) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		// An `online` booking can't be confirmed while the payment engine is inert (stripped) —
		// there is no capture, so the "money before commitment" step can't run. Cash/on_arrival
		// confirms flow straight through.
		if (booking.paymentMethod === 'online') {
			return { success: false, message: { key: 'GenericMessages.PAYMENT_NOT_READY' } };
		}

		await ctx.db.patch(args.bookingId, { ...patch });

		// Everyone else who wanted these nights just lost. Tell them now rather than
		// letting them wait out the full 48h for an expiry that is already decided.
		const losers = await findOverlappingPendingBookings(
			ctx,
			booking.apartmentId,
			booking.checkInDate,
			booking.checkOutDate,
			args.bookingId
		);

		const apartmentTitle = apartment.title;

		for (const loser of losers) {
			const losingPatch = applyAutoDecline(loser, 'dates_taken');
			if (!losingPatch) continue;

			await ctx.db.patch(loser._id, { ...losingPatch });

			await sendBookingAutoDeclinedEmail(ctx, {
				// No per-guest locale is stored on the booking; these default to English.
				locale: 'en',
				reason: 'dates_taken',
				bookingCode: loser.bookingCode,
				guestFirstName: loser.guestFirstName,
				guestEmail: loser.guestEmail,
				apartmentTitle,
				checkInDate: loser.checkInDate,
				checkOutDate: loser.checkOutDate
			});
		}

		await analytics.track(ctx, ANALYTICS_EVENT.BOOKING_CONFIRMED, { hostId: booking.hostId });
		// Money + occupancy rollups — the booking is now earning.
		await recordGmv(ctx, booking, 'confirmed');
		await recordNights(ctx, booking, 'booked');

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
