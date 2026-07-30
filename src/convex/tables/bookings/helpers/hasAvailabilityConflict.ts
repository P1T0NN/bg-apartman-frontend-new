// UTILS
import { BLOCKING_BOOKING_STATUSES } from '@/shared/features/booking/data/bookingsData';
import { nightRangesOverlap } from '@/shared/features/booking/utils/nightRangesOverlap';

// TYPES
import type { Id } from '@/convex/_generated/dataModel';
import type { QueryCtx } from '@/convex/_generated/server';

/**
 * Is [checkInDate, checkOutDate) unavailable on this apartment?
 *
 * Availability = blocking bookings (`confirmed` / `checked_in`) + the host's own calendar
 * blocks (BookingSystemDesign.md §6). Both tables are read here and NOWHERE else joins
 * them — one definition of "free", so create, confirm, and search can never disagree.
 *
 * `pending` bookings are not conflicts: requests block nothing until a host confirms one.
 *
 * Called INSIDE the deciding mutation, twice in a booking's life (create, then confirm).
 * Convex mutations are serializable, so the re-check + patch is atomic — two hosts
 * confirming overlapping requests cannot both win.
 *
 * Performance: the `by_apartment_dates` index pre-trims bookings to those starting before
 * this stay ends; blocks are read per-apartment, ordered by start date. The overlap test
 * then runs in memory over a small per-apartment slice.
 */
export async function hasAvailabilityConflict(
	ctx: QueryCtx,
	apartmentId: Id<'apartments'>,
	checkInDate: string,
	checkOutDate: string
): Promise<boolean> {
	const bookingsStartingBefore = await ctx.db
		.query('bookings')
		.withIndex('by_apartment_dates', (q) =>
			q.eq('apartmentId', apartmentId).lt('checkInDate', checkOutDate)
		)
		.collect();

	const bookingConflict = bookingsStartingBefore.some(
		(booking) =>
			BLOCKING_BOOKING_STATUSES.has(booking.status) &&
			nightRangesOverlap(checkInDate, checkOutDate, booking.checkInDate, booking.checkOutDate)
	);
	if (bookingConflict) return true;

	const blocksStartingBefore = await ctx.db
		.query('apartmentBlocks')
		.withIndex('by_apartment', (q) =>
			q.eq('apartmentId', apartmentId).lt('startDate', checkOutDate)
		)
		.collect();

	return blocksStartingBefore.some((block) =>
		nightRangesOverlap(checkInDate, checkOutDate, block.startDate, block.endDate)
	);
}
