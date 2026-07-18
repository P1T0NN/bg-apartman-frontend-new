// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// HELPERS
import {
	optionalOneBasedPageArg,
	paginatedQueryArgs,
	toPaginatedListPayload
} from '@/convex/helpers/paginationHelpers';
import { resolveFavoriteAccommodations } from '../helpers/resolveFavoriteAccommodations';

// TYPES
import type { PaginatedListPayload } from '@/shared/components/ui/data-table/types';
import type { SearchAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';

/**
 * Paginated saved accommodations for the guest favorites page.
 *
 * App-specific (not built on `fetchOptimized`): favorites are a client-held id list, not an
 * indexable table query. `resolveFavoriteAccommodations` point-reads + sanitizes the ids, then
 * `toPaginatedListPayload` slices the requested offset page and reports an exact `totalCount`
 * for `ConvexDataList`'s offset mode. The page slice is the only thing mapped per request.
 */
export const fetchFavoriteAccommodationsSafe = query({
	args: {
		ids: v.array(v.id('apartments')),
		...paginatedQueryArgs,
		page: optionalOneBasedPageArg
	},
	handler: async (ctx, args): Promise<PaginatedListPayload<SearchAccommodation>> => {
		const accommodations = await resolveFavoriteAccommodations(ctx, args.ids);

		return toPaginatedListPayload({
			page: args.page,
			paginationOpts: args.paginationOpts,
			fetch: async ({ limit, offset }) => ({
				items: accommodations.slice(offset, offset + limit),
				total: accommodations.length
			})
		});
	}
});
