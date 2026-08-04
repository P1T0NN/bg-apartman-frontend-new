// CONFIG
import { PROJECT_SETTINGS } from '@/shared/config';

// UTILS
import { nightRangesOverlap } from '@/shared/features/booking/utils/nightRangesOverlap';
import { shiftIsoDate } from '@/shared/utils/dateUtils';

// TYPES
import type { Doc, Id } from '@/convex/_generated/dataModel';
import type { QueryCtx } from '@/convex/_generated/server';

/**
 * The other `pending` requests on this apartment whose nights clash with the one being
 * confirmed — the losers of the race (BookingSystemDesign.md §6).
 *
 * They are auto-declined inside the same confirm mutation rather than left to expire:
 * waiting up to 48h to tell a guest their dates are gone wastes their search time and
 * buys the host nothing.
 *
 * `awaiting` rows are excluded: an open checkout is invisible — nobody has been told
 * anything about it, so there is nobody to auto-decline (PaymentsSystemDesign.md §3). If
 * that guest does complete payment, the authorization webhook re-checks availability and
 * releases the hold with the lost-race copy.
 */
export async function findOverlappingPendingBookings(
	ctx: QueryCtx,
	apartmentId: Id<'apartments'>,
	checkInDate: string,
	checkOutDate: string,
	excludeBookingId: Id<'bookings'>
): Promise<Doc<'bookings'>[]> {
	// Reads ONLY pending rows in the overlap window. The status column keeps every terminal
	// row out of the read entirely, and the lower bound keeps it a fixed-width scan: a stay
	// can reach into this window only if it starts within MAX_STAY_NIGHTS of it, a ceiling
	// `createBookingSchema` enforces.
	const overlapping = await ctx.db
		.query('bookings')
		.withIndex('by_apartment_status_checkin', (q) =>
			q
				.eq('apartmentId', apartmentId)
				.eq('status', 'pending')
				.gte('checkInDate', shiftIsoDate(checkInDate, -PROJECT_SETTINGS.MAX_STAY_NIGHTS))
				.lt('checkInDate', checkOutDate)
		)
		.collect();

	return overlapping.filter(
		(booking) =>
			booking._id !== excludeBookingId &&
			booking.paymentStatus !== 'awaiting' &&
			nightRangesOverlap(checkInDate, checkOutDate, booking.checkInDate, booking.checkOutDate)
	);
}
