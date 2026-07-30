// LIBRARIES
import { v } from 'convex/values';

// UTILS
import { authMutation } from '@/convex/auth/middleware/authMiddleware';
import { analytics, ANALYTICS_EVENT, hostAnalyticsScope } from '@/convex/analytics';
import { trackBookingNights } from '@/convex/tables/bookings/helpers/trackBookingNights';
import { sendBookingConfirmedEmail } from '@/convex/email/sendBookingConfirmedEmail';
import { sendBookingAutoDeclinedEmail } from '@/convex/email/sendBookingAutoDeclinedEmail';
import { applyHostAction } from '@/shared/features/booking/utils/applyHostAction';
import { applyAutoDecline } from '@/shared/features/booking/utils/applyAutoDecline';
import { hostMayPerform } from '@/shared/features/booking/utils/hostMayPerform';

// HELPERS
import { hasAvailabilityConflict } from '@/convex/tables/bookings/helpers/hasAvailabilityConflict';
import { findOverlappingPendingBookings } from '@/convex/tables/bookings/helpers/findOverlappingPendingBookings';
import { paymentsAdapter } from '@/convex/payments/adapter';
import { recordCapturedEarnings } from '@/convex/payments/helpers/recordCapturedEarnings';
import { settleBookingPayment } from '@/convex/payments/helpers/settleBookingPayment';

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

		// Money before commitment: an online booking is CAPTURED at this click
		// (PaymentsSystemDesign.md §3). If the capture fails — hold expired, card died — the
		// confirm fails WHOLE: the booking stays `pending`, no competing request is declined,
		// no email goes out, and the host is told to have the guest rebook. There is no
		// partial confirm.
		let capturePatch: { paymentStatus?: 'paid' } = {};
		if (booking.paymentMethod === 'online') {
			if (booking.paymentStatus !== 'authorized' || !booking.paymentRef) {
				return { success: false, message: { key: 'GenericMessages.PAYMENT_NOT_READY' } };
			}
			try {
				await paymentsAdapter.capture(booking.paymentRef);
			} catch {
				return { success: false, message: { key: 'GenericMessages.PAYMENT_CAPTURE_FAILED' } };
			}
			capturePatch = { paymentStatus: 'paid' };
		}

		await ctx.db.patch(args.bookingId, { ...patch, ...capturePatch });

		// The ledger row is written at capture time, from the booking's price snapshot, and
		// carries stage 3's "you earned €X" ask (PaymentsSystemDesign.md §2, §5).
		if (capturePatch.paymentStatus === 'paid') {
			await recordCapturedEarnings(ctx, { ...booking, paymentStatus: 'paid' });
		}

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

			// A losing request that had authorized a card gets its hold released — the
			// "nothing was charged" line in the email below has to be true (PSD §4).
			const losingSettlement = await settleBookingPayment(ctx, loser);

			await ctx.db.patch(loser._id, { ...losingPatch, ...losingSettlement });

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

		await analytics.track(ctx, ANALYTICS_EVENT.BOOKING_CONFIRMED, {
			actorId: ctx.userId,
			scopes: [hostAnalyticsScope(booking.hostId)],
			properties: { totalEuros: booking.total, paymentMethod: booking.paymentMethod }
		});
		// Occupancy ledger, split per calendar month — the booking is now earning.
		await trackBookingNights(ctx, booking, 'booked');

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
