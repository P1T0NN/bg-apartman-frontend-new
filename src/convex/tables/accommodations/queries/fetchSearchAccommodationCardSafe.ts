// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// UTILS
import { apartmentToSearchAccommodation } from '../utils/apartmentToSearchAccommodation';

// TYPES
import type { SearchAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';

/**
 * One search card by id — what a clicked map pin needs.
 *
 * Markers carry four fields so all of them can be loaded (`fetchSearchMapMarkersSafe`); the card
 * behind a pin is fetched only when someone actually clicks it. ONE document read, so this scales
 * with clicks rather than with catalogue size.
 *
 * Re-applies the same visibility rules as the search stream instead of trusting that the id came
 * from it: an id is client-supplied, and a listing can be unpublished between the marker load and
 * the click. Returns `null` in that case — the map just closes the preview rather than showing a
 * stay nobody can book.
 */
export const fetchSearchAccommodationCardSafe = query({
	args: { id: v.id('apartments') },
	handler: async (ctx, args): Promise<SearchAccommodation | null> => {
		const apartment = await ctx.db.get(args.id);

		if (
			!apartment ||
			apartment.status !== 'published' ||
			apartment.coordinates === undefined ||
			apartment.images.length === 0
		) {
			return null;
		}

		return apartmentToSearchAccommodation(apartment);
	}
});
