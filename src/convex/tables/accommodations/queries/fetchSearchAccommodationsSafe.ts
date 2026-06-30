// LIBRARIES
import { v } from 'convex/values';

// SERVER
import { query } from '@/convex/_generated/server';

// UTILS
import { apartmentToSearchListing } from '../utils/apartmentToSearchListing';

// TYPES
import type { SearchListing } from '@/shared/features/accommodation/types/accommodationTypes';

// Upper bound on rows scanned/returned. The search UI loads the whole set at once (the map
// shows every marker; the list paginates client-side), so we cap reads here.
// ponytail: fine while listings number in the dozens/low hundreds — switch the panes to
// cursor pagination (fetchOptimized) if the catalogue grows past this.
const SEARCH_LIMIT = 200;

/**
 * Public search over published apartments for the results page (list + map).
 *
 * "Safe": returns a sanitized {@link SearchListing} projection (no `hostId` or other internal
 * fields), not raw apartment rows. Convex reads whole documents — the trim happens in
 * `apartmentToSearchListing` before anything leaves the server.
 *
 * Lists published rows via `by_status` (capped at {@link SEARCH_LIMIT}), then filters in memory:
 * when a region is chosen the client sends its `placeId` (the picked city's or country's Google
 * place id), and a listing matches if its merged `placeId` ("<cityId> <countryId>") contains it —
 * so picking a city keeps that city's listings and picking a country keeps the whole country.
 * Place ids are language-independent, so "Belgrade"/"Beograd" and "Serbia"/"Srbija" all match.
 * Count minimums are applied alongside. Returns the full matching set (not a page) because the
 * map needs every marker — both panes consume this {@link SearchListing}[] directly.
 *
 * Only rows with coordinates AND at least one photo are returned: both are required to
 * render a map marker and a card.
 *
 * ponytail: the place-id match runs in memory (a substring/parts test isn't an index range scan).
 * Fine at the documented scale; switch to a search index + pagination past it.
 *
 * ponytail: `checkIn`/`checkOut` are accepted but not yet used to filter. Bookings don't
 * carry a real `apartmentId` yet (the booking flow still runs on dummy listing data), so
 * there is nothing to check availability against — wire it once bookings link to apartments.
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
	handler: async (ctx, args): Promise<SearchListing[]> => {
		const placeId = args.placeId;

		const candidates = await ctx.db
			.query('apartments')
			.withIndex('by_status', (q) => q.eq('status', 'published'))
			.take(SEARCH_LIMIT);

		return candidates
			.filter(
				(a) =>
					a.coordinates !== undefined &&
					a.images.length > 0 &&
					(placeId === undefined || (a.placeId?.split(' ').includes(placeId) ?? false)) &&
					(args.bedrooms === undefined || a.bedrooms >= args.bedrooms) &&
					(args.bathrooms === undefined || a.bathrooms >= args.bathrooms) &&
					(args.guests === undefined || a.maxGuests >= args.guests)
			)
			.map(apartmentToSearchListing);
	}
});
