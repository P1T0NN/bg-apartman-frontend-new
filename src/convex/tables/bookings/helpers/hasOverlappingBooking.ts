// UTILS
import { ACTIVE_BOOKING_STATUSES } from '@/shared/features/booking/data/bookingsData';

// TYPES
import type { Id } from '@/convex/_generated/dataModel';
import type { QueryCtx } from '@/convex/_generated/server';

/**
 * Whether the apartment already has an active (pending/confirmed/checked_in) booking whose
 * nights overlap [checkInDate, checkOutDate).
 *
 * Ranges are half-open — a stay ending on X never overlaps one starting on X, so same-day
 * turnover (checkout morning → checkin afternoon) is allowed. ISO dates compare
 * lexicographically, so plain string comparison is a correct date comparison.
 *
 * Performance: the `by_apartment_dates` index range (`apartmentId` + `checkInDate <
 * checkOutDate`) pre-trims to bookings that start before the new stay ends; the remaining
 * overlap + status test runs in memory over that small per-apartment slice.
 */
export async function hasOverlappingBooking(
	ctx: QueryCtx,
	apartmentId: Id<'apartments'>,
	checkInDate: string,
	checkOutDate: string
): Promise<boolean> {
	const startingBefore = await ctx.db
		.query('bookings')
		.withIndex('by_apartment_dates', (q) =>
			q.eq('apartmentId', apartmentId).lt('checkInDate', checkOutDate)
		)
		.collect();

	return startingBefore.some(
		(booking) =>
			ACTIVE_BOOKING_STATUSES.has(booking.status) && booking.checkOutDate > checkInDate
	);
}
