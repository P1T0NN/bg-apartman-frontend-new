// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// HELPERS
import {
	optionalOneBasedPageArg,
	paginatedQueryArgs,
	toPaginatedListPayload
} from '@/convex/helpers/paginationHelpers';
import { resolveFavoriteListings } from '../helpers/resolveFavoriteListings';

// TYPES
import type { PaginatedListPayload } from '@/shared/components/ui/data-table/types';
import type { SearchListing } from '@/shared/features/accommodation/types/accommodationTypes';

/**
 * Paginated saved listings for the guest favorites page.
 *
 * App-specific (not built on `fetchOptimized`): favorites are a client-held id list, not an
 * indexable table query. `resolveFavoriteListings` point-reads + sanitizes the ids, then
 * `toPaginatedListPayload` slices the requested offset page and reports an exact `totalCount`
 * for `ConvexDataList`'s offset mode. The page slice is the only thing mapped per request.
 */
export const fetchFavoriteAccommodationsSafe = query({
	args: {
		ids: v.array(v.id('apartments')),
		...paginatedQueryArgs,
		page: optionalOneBasedPageArg
	},
	handler: async (ctx, args): Promise<PaginatedListPayload<SearchListing>> => {
		const listings = await resolveFavoriteListings(ctx, args.ids);

		return toPaginatedListPayload({
			page: args.page,
			paginationOpts: args.paginationOpts,
			fetch: async ({ limit, offset }) => ({
				items: listings.slice(offset, offset + limit),
				total: listings.length
			})
		});
	}
});
