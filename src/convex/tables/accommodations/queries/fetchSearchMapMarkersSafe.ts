// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// CONFIG
import { SEARCH_DATA } from '@/shared/config';

// HELPERS
import { paginatedQueryArgs } from '@/convex/pagination/paginationHelpers';
import {
	searchAccommodationsArgs,
	searchAccommodationsStream
} from '../helpers/searchAccommodationsStream';

// UTILS
import { effectiveNightlyPrice } from '@/shared/features/pricing/utils/calculatePrice';

// TYPES
import type { SearchMarker } from '@/shared/features/accommodation/types/accommodationTypes';

const searchMarker = v.object({
	id: v.id('apartments'),
	lat: v.number(),
	lng: v.number(),
	pricePerNight: v.number()
});

/**
 * The `/search` MAP markers — the same matching set as the list, four fields per pin.
 *
 * The map has to show every result (a pin for page 1 only would misrepresent where the stays
 * are), and that requirement is what used to force the whole card payload through one query. So
 * it gets its own endpoint with the smallest shape that can draw a pin and its price tag: an id
 * to click, a coordinate to place, a price to print. ~60 bytes per listing instead of ~500.
 *
 * Clicking a pin needs the full card, which is one point read — `fetchSearchAccommodationCardSafe`
 * — paid only for the pin actually clicked, instead of for every pin up front.
 *
 * Paginated like the list, and drained by the client until `isDone`, so a region with 100,000
 * listings gets 100,000 pins without any single request being large. The page SIZE is bigger
 * than the list's (`MAP_MARKER_PAGE_SIZE`) because pins are tiny; the real cost is the apartment
 * rows read to make them, which the byte/row guards bound. Rendering is already the map's
 * problem and already solved: it clusters (SuperCluster) and mounts marker content only for pins
 * on screen.
 *
 * Bespoke rather than a `fetchOptimized` (README § Kit) for exactly one reason: the factory
 * clamps every page to `HARD_MAX_PAGE_SIZE` (100), which is right for endpoints returning rows
 * and wrong here — it would turn a 10,000-listing region into 100 round trips. The clamp is
 * replaced, not removed: `numItems` is bounded by `MAP_MARKER_PAGE_SIZE` on the same principle
 * (a public endpoint must not be able to ask for an unbounded page).
 *
 * ponytail: pins stream in progressively, which is right up to the tens of thousands. Past that,
 * the answer is not more pins — it is server-side cluster COUNTS (a geo-cell column + one
 * aggregate namespaced by cell, swapping in individual markers at high zoom). That is a schema +
 * write-path build, so it is not guessed here; this endpoint's shape is the one it would replace.
 */
export const fetchSearchMapMarkersSafe = query({
	args: { ...searchAccommodationsArgs, ...paginatedQueryArgs },
	returns: v.object({
		page: v.array(searchMarker),
		isDone: v.boolean(),
		continueCursor: v.string()
	}),
	handler: async (ctx, args) => {
		const requested = args.paginationOpts?.numItems ?? SEARCH_DATA.MAP_MARKER_PAGE_SIZE;
		const numItems = Math.min(Math.max(1, Math.floor(requested)), SEARCH_DATA.MAP_MARKER_PAGE_SIZE);

		const result = await searchAccommodationsStream(ctx, args).paginate({
			numItems,
			cursor: args.paginationOpts?.cursor ?? null,
			maximumRowsRead: SEARCH_DATA.SEARCH_PAGE_MAX_ROWS_READ,
			maximumBytesRead: SEARCH_DATA.SEARCH_PAGE_MAX_BYTES_READ
		});

		const page: SearchMarker[] = result.page.map((a) => ({
			id: a._id,
			// The stream guarantees coordinates — it rejects rows without them.
			lat: a.coordinates!.lat,
			lng: a.coordinates!.lng,
			pricePerNight: effectiveNightlyPrice(a)
		}));

		return { page, isDone: result.isDone, continueCursor: result.continueCursor };
	}
});
