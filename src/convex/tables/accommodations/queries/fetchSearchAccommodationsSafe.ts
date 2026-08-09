// PAGINATION
import { fetchOptimized } from '@/convex/pagination/fetchOptimized';

// CONFIG
import { SEARCH_DATA } from '@/shared/config';

// UTILS
import { apartmentToSearchAccommodation } from '../utils/apartmentToSearchAccommodation';
import {
	searchAccommodationsArgs,
	searchAccommodationsStream
} from '../helpers/searchAccommodationsStream';

// TYPES
import type { SearchAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';

/**
 * The `/search` results LIST — one cursor page of cards at a time.
 *
 * "Safe": `enrich` projects each row to the sanitized {@link SearchAccommodation} card shape (no
 * `hostId`, no internal fields) before anything leaves the server. Convex reads whole documents;
 * the trim happens here.
 *
 * **This is real server-side pagination.** The page is `numItems` cards, and the request reads
 * only the rows needed to fill it. It used to return the entire matching set so the list could
 * `.slice(0, 12)` it client-side — which meant a 1,000-listing region shipped 1,000 cards to
 * render 12, and the map's marker requirement was the excuse. Markers now have their own lean
 * endpoint (`fetchSearchMapMarkersSafe`), so nothing forces this one to be whole-set anymore.
 *
 * `resolve` rather than `where`/`union` because the count minimums and date availability cannot
 * be index ranges (Convex allows one range field per index) and `fetchOptimized`'s indexed modes
 * deliberately refuse post-scan filters. The factory still owns everything that must not drift —
 * args validators, the page-size clamp, the payload envelope, `enrich` — and the middle is a
 * stream that paginates honestly. See `searchAccommodationsStream` for why nothing truncates.
 *
 * `totalCount` is `null`, as in every cursor surface. The exact count comes from the marker
 * stream, which the map drains anyway — so the header gets a real number without a second scan.
 */
export const fetchSearchAccommodationsSafe = fetchOptimized({
	table: 'apartments',
	args: searchAccommodationsArgs,
	strategy: 'cursor',
	order: 'desc',
	resolve: async (ctx, args, { numItems, cursor }) => {
		const result = await searchAccommodationsStream(ctx, args).paginate({
			numItems,
			cursor,
			maximumRowsRead: SEARCH_DATA.SEARCH_PAGE_MAX_ROWS_READ,
			maximumBytesRead: SEARCH_DATA.SEARCH_PAGE_MAX_BYTES_READ
		});

		return {
			page: result.page,
			isDone: result.isDone,
			continueCursor: result.continueCursor
		};
	},
	enrich: (_ctx, page): SearchAccommodation[] => page.map(apartmentToSearchAccommodation)
});
