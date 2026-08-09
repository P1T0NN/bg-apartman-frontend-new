// CONFIG
import { PROJECT_SETTINGS } from '@/shared/config';

// UTILS
import { BLOCKING_BOOKING_STATUSES } from '@/shared/features/booking/data/bookingsData';
import { nightRangesOverlap } from '@/shared/features/booking/utils/nightRangesOverlap';
import { shiftIsoDate } from '@/shared/utils/dateUtils';

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
 * **Cost.** This is the hottest read in the app: `/search` calls it once per candidate a dated
 * query examines. That fan-out is now bounded by the PAGE — the search stream applies this
 * filter lazily inside `.paginate()` (`searchAccommodationsStream`), so a dated search costs
 * O(rows examined for this page), not O(every listing in the region) on every keystroke. Both
 * reads below are still bounded on BOTH ends with a fixed width, independent of how long a
 * listing has been on the platform:
 *
 *   - bookings: a stay can only overlap this window if it starts within
 *     `MAX_STAY_NIGHTS` before it. That ceiling is enforced by `createBookingSchema`, which
 *     is what makes the lower bound safe rather than a guess — raise one and you must raise
 *     the other, or long stays stop being seen and their nights become double-bookable.
 *   - blocks: exact, no assumption needed. Blocks are always single-night
 *     (`endDate = startDate + 1`, see `blockApartmentDates`), so a block overlaps this
 *     window iff its `startDate` falls inside it.
 */
export async function hasAvailabilityConflict(
	ctx: QueryCtx,
	apartmentId: Id<'apartments'>,
	checkInDate: string,
	checkOutDate: string
): Promise<boolean> {
	const earliestOverlappingCheckIn = shiftIsoDate(checkInDate, -PROJECT_SETTINGS.MAX_STAY_NIGHTS);

	const bookingsStartingBefore = await ctx.db
		.query('bookings')
		.withIndex('by_apartment_dates', (q) =>
			q
				.eq('apartmentId', apartmentId)
				.gte('checkInDate', earliestOverlappingCheckIn)
				.lt('checkInDate', checkOutDate)
		)
		.collect();

	const bookingConflict = bookingsStartingBefore.some(
		(booking) =>
			BLOCKING_BOOKING_STATUSES.has(booking.status) &&
			nightRangesOverlap(checkInDate, checkOutDate, booking.checkInDate, booking.checkOutDate)
	);
	if (bookingConflict) return true;

	const overlappingBlocks = await ctx.db
		.query('apartmentBlocks')
		.withIndex('by_apartment', (q) =>
			q.eq('apartmentId', apartmentId).gte('startDate', checkInDate).lt('startDate', checkOutDate)
		)
		.collect();

	return overlappingBlocks.length > 0;
}
