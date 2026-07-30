// LIBRARIES
import { v } from 'convex/values';
import { zodToConvexFields } from 'convex-helpers/server/zod4';
import { mutation } from '@/convex/functions';

// UTILS
import { convexRateLimiter } from '@/convex/convexRateLimiter';

// SCHEMAS
import { findMyReservationSchema } from '@/shared/features/booking/schemas/bookingsSchemas';
import { mutationResultData } from '@/convex/schemas/schemas';

const reservationLink = v.object({ bookingId: v.id('bookings') });

/**
 * Self-serve "I lost my reservation email" lookup for `/reservations`
 * (GuestSystemDesign.md §3).
 *
 * A mutation rather than a query because it must charge a rate limit: the booking code is
 * short and human-readable, so the door needs a lock. Keyed by the submitted email, which
 * is the pair an attacker would have to hold fixed while guessing codes.
 *
 * Failure is deliberately generic — same message for "no such code", "wrong email" and
 * "code exists but isn't yours" — so this is never an oracle for which codes exist. A
 * schema failure joins that same generic path for the same reason.
 *
 * Args are DERIVED from the shared `findMyReservationSchema`, the object the recovery form
 * validates against, and re-run here authoritatively.
 */
export const findMyReservation = mutation({
	args: zodToConvexFields(findMyReservationSchema.shape),
	returns: mutationResultData(reservationLink),
	handler: async (ctx, rawArgs) => {
		const parsed = findMyReservationSchema.safeParse(rawArgs);
		if (!parsed.success) {
			return { success: false, message: { key: 'GenericMessages.RESERVATION_NOT_FOUND' } };
		}

		// The schema trimmed both; case-fold so a code/email typed in any casing still matches.
		const bookingCode = parsed.data.bookingCode.toUpperCase();
		const email = parsed.data.email.toLowerCase();

		await convexRateLimiter.limit(ctx, 'findMyReservation', { key: email, throws: true });

		const booking = await ctx.db
			.query('bookings')
			.withIndex('by_booking_code', (q) => q.eq('bookingCode', bookingCode))
			.first();

		if (!booking || booking.guestEmail.trim().toLowerCase() !== email) {
			return { success: false, message: { key: 'GenericMessages.RESERVATION_NOT_FOUND' } };
		}

		return {
			success: true,
			message: { key: 'GenericMessages.RESERVATION_FOUND' },
			data: { bookingId: booking._id }
		};
	}
});
