// LIBRARIES
import type { Crons } from 'convex/server';

// TYPES
import type { internal } from '../../_generated/api';

type InternalApi = typeof internal;

export function registerAccommodationCrons(crons: Crons, internalApi: InternalApi) {
	/**
	 * Listing-fee lifecycle: T−7 reminders and the `published` → `expired` flip past grace
	 * (AccommodationsSystemDesign.md §8). Daily, because both boundaries are day-shaped and
	 * a missed run just means the next one catches up.
	 *
	 * Registered now, inert until `ACCOMMODATIONS_CONFIG.MONETIZATION` is `'listing_fee'` —
	 * one early return, one invocation a day until then.
	 */
	crons.daily(
		'listing fee sweep',
		{ hourUTC: 5, minuteUTC: 0 },
		internalApi.tables.accommodations.crons.listingFeeSweepCron.listingFeeSweep,
		{}
	);
}
