// CONFIG
import { PROJECT_SETTINGS } from '@/shared/config';

// UTILS
import { nightsBetween } from '@/shared/utils/dateUtils';

/**
 * Is this stay short enough to be storable?
 *
 * The ceiling is load-bearing well beyond the booking form: every availability read bounds
 * its index scan to stays STARTING within `MAX_STAY_NIGHTS` of the window it cares about
 * (`hasAvailabilityConflict`, `findOverlappingPendingBookings`, the calendar and book-page
 * reads). A stay longer than that would sit outside those ranges, so the reads would not see
 * it and the nights it occupies would be double-bookable.
 *
 * Which is why this is enforced at the schema, not just suggested in the UI — it is what
 * turns the bound from a guess into a guarantee. `availabilityBounds.check.ts` asserts the
 * two stay in step.
 */
export function withinMaxStay(checkIn: string, checkOut: string): boolean {
	return nightsBetween(checkIn, checkOut) <= PROJECT_SETTINGS.MAX_STAY_NIGHTS;
}
