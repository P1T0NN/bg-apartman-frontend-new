// CONFIG
import { OPERATIONAL_LIMITS } from '@/shared/config';

// LIBRARIES
import { v } from 'convex/values';

// SERVER
import { query } from '@/convex/_generated/server';

// UTILS
import { apartmentToSearchAccommodation } from '../utils/apartmentToSearchAccommodation';
import { hasAvailabilityConflict } from '@/convex/tables/bookings/helpers/hasAvailabilityConflict';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { SearchAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';

/**
 * Public search over published apartments for the results page (list + map).
 *
 * "Safe": returns a sanitized {@link SearchAccommodation} projection (no `hostId` or other
 * internal fields), not raw apartment rows. Convex reads whole documents — the trim happens
 * in `apartmentToSearchAccommodation` before anything leaves the server.
 *
 * **Region matching is indexed, and that is a correctness property, not an optimization.**
 * The picked region is a Google place id, so it is language-independent — searching "Beograd"
 * and searching "Belgrade" resolve to the same id and return the same listings. A listing
 * stores its city and country ids in their own columns (`splitRegionPlaceId`, written by the
 * create/update mutations), so a region search is an exact index range: it reads that region's
 * published listings and nothing else. Two indexes because the search box offers cities AND
 * countries, and the caller doesn't tell us which kind it picked — we ask both and union.
 *
 * The previous version read the first `SEARCH_SCAN_LIMIT` published rows in creation order and
 * matched the region in memory. That is why this had to change: past that many listings, the
 * newest were never in the sample, so they were invisible to EVERY search — and a city whose
 * listings all fell outside the sample returned nothing at all while matching listings existed.
 *
 * Count minimums stay in memory on purpose: Convex allows one range field per index, so
 * `bedrooms >= a AND bathrooms >= b AND guests >= c` cannot be an index range at any field
 * ordering. They are cheap here because they now narrow ONE region's rows, not a truncated
 * slice of the whole table.
 *
 * Returns the full matching set (not a page) because the map needs every marker — both panes
 * consume this array, and the list's infinite scroll paginates it client-side.
 *
 * Only rows with coordinates AND at least one photo are returned: both are required to render
 * a map marker and a card.
 *
 * `checkIn`/`checkOut`: when a valid range is chosen, apartments with an active overlapping
 * booking are excluded via {@link hasAvailabilityConflict} (indexed per-apartment reads).
 */
export const fetchSearchAccommodationsSafe = query({
	args: {
		placeId: v.optional(v.string()),
		checkIn: v.optional(v.string()),
		checkOut: v.optional(v.string()),
		bedrooms: v.optional(v.number()),
		bathrooms: v.optional(v.number()),
		guests: v.optional(v.number())
	},
	handler: async (ctx, args): Promise<SearchAccommodation[]> => {
		const { placeId } = args;

		let candidates: Doc<'apartments'>[];

		if (placeId === undefined) {
			// No region picked — an unscoped browse. There is no index to bound this to, so it
			// keeps a cap. Acceptable because it answers "show me anything", not "show me X":
			// every listing is still reachable by searching its region, which is the path that
			// had to stop truncating.
			candidates = await ctx.db
				.query('apartments')
				.withIndex('by_status', (q) => q.eq('status', 'published'))
				.take(OPERATIONAL_LIMITS.SEARCH_SCAN_LIMIT);

			if (candidates.length >= OPERATIONAL_LIMITS.SEARCH_SCAN_LIMIT) {
				console.warn('[fetchSearchAccommodationsSafe] unscoped browse hit its cap', {
					cap: OPERATIONAL_LIMITS.SEARCH_SCAN_LIMIT
				});
			}
		} else {
			// A city id matches `cityPlaceId`, a country id matches `countryPlaceId`. Both reads
			// are exact index ranges, so each costs only the rows it returns.
			const [byCity, byCountry] = await Promise.all([
				ctx.db
					.query('apartments')
					.withIndex('by_status_city', (q) =>
						q.eq('status', 'published').eq('cityPlaceId', placeId)
					)
					.collect(),
				ctx.db
					.query('apartments')
					.withIndex('by_status_country', (q) =>
						q.eq('status', 'published').eq('countryPlaceId', placeId)
					)
					.collect()
			]);

			// A listing whose city and country ids are equal (the unsplit-fallback case) lands
			// in both reads — dedupe so it renders one card and one marker.
			candidates = [...new Map([...byCity, ...byCountry].map((a) => [a._id, a])).values()];
		}

		const matching = candidates.filter(
			(a) =>
				a.coordinates !== undefined &&
				a.images.length > 0 &&
				(args.bedrooms === undefined || a.bedrooms >= args.bedrooms) &&
				(args.bathrooms === undefined || a.bathrooms >= args.bathrooms) &&
				(args.guests === undefined || a.maxGuests >= args.guests)
		);

		// Date availability: with a valid range chosen, drop apartments that have an active
		// booking overlapping it. One index slice per candidate, each bounded to a fixed-width
		// date window by `MAX_STAY_NIGHTS` — see `hasAvailabilityConflict`.
		const { checkIn, checkOut } = args;
		if (checkIn && checkOut && checkIn < checkOut) {
			const availability = await Promise.all(
				matching.map((a) => hasAvailabilityConflict(ctx, a._id, checkIn, checkOut))
			);
			return matching.filter((_, i) => !availability[i]).map(apartmentToSearchAccommodation);
		}

		return matching.map(apartmentToSearchAccommodation);
	}
});
