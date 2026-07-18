// LIBRARIES
import { v } from 'convex/values';

// SERVER
import { query } from '@/convex/_generated/server';

// UTILS
import { apartmentToSearchAccommodation } from '../utils/apartmentToSearchAccommodation';
import { hasOverlappingBooking } from '@/convex/tables/bookings/helpers/hasOverlappingBooking';

// TYPES
import type { SearchAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';

// Upper bound on rows scanned/returned. The search UI loads the whole set at once (the map
// shows every marker; the list paginates client-side), so we cap reads here.
// ponytail: fine while accommodations number in the dozens/low hundreds — switch the panes to
// cursor pagination (fetchOptimized) if the catalogue grows past this.
const SEARCH_LIMIT = 200;

/**
 * Public search over published apartments for the results page (list + map).
 *
 * "Safe": returns a sanitized {@link SearchAccommodation} projection (no `hostId` or other internal
 * fields), not raw apartment rows. Convex reads whole documents — the trim happens in
 * `apartmentToSearchAccommodation` before anything leaves the server.
 *
 * Lists published rows via `by_status` (capped at {@link SEARCH_LIMIT}), then filters in memory:
 * when a region is chosen the client sends its `placeId` (the picked city's or country's Google
 * place id), and a accommodation matches if its merged `placeId` ("<cityId> <countryId>") contains it —
 * so picking a city keeps that city's accommodations and picking a country keeps the whole country.
 * Place ids are language-independent, so "Belgrade"/"Beograd" and "Serbia"/"Srbija" all match.
 * Count minimums are applied alongside. Returns the full matching set (not a page) because the
 * map needs every marker — both panes consume this {@link SearchAccommodation}[] directly.
 *
 * Only rows with coordinates AND at least one photo are returned: both are required to
 * render a map marker and a card.
 *
 * ponytail: the place-id match runs in memory (a substring/parts test isn't an index range scan).
 * Fine at the documented scale; switch to a search index + pagination past it.
 *
 * `checkIn`/`checkOut`: when a valid range is chosen, apartments with an active overlapping
 * booking are excluded via {@link hasOverlappingBooking} (indexed per-apartment reads).
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
		const placeId = args.placeId;

		const candidates = await ctx.db
			.query('apartments')
			.withIndex('by_status', (q) => q.eq('status', 'published'))
			.take(SEARCH_LIMIT);

		const matching = candidates.filter(
			(a) =>
				a.coordinates !== undefined &&
				a.images.length > 0 &&
				(placeId === undefined || (a.placeId?.split(' ').includes(placeId) ?? false)) &&
				(args.bedrooms === undefined || a.bedrooms >= args.bedrooms) &&
				(args.bathrooms === undefined || a.bathrooms >= args.bathrooms) &&
				(args.guests === undefined || a.maxGuests >= args.guests)
		);

		// Date availability: with a valid range chosen, drop apartments that have an active
		// booking overlapping it. One indexed per-apartment read (by_apartment_dates) for each
		// remaining candidate — bounded by SEARCH_LIMIT and each read is a small index slice.
		const { checkIn, checkOut } = args;
		if (checkIn && checkOut && checkIn < checkOut) {
			const availability = await Promise.all(
				matching.map((a) => hasOverlappingBooking(ctx, a._id, checkIn, checkOut))
			);
			return matching
				.filter((_, i) => !availability[i])
				.map(apartmentToSearchAccommodation);
		}

		return matching.map(apartmentToSearchAccommodation);
	}
});
