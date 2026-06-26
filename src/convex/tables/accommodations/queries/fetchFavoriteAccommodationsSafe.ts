// LIBRARIES
import { v } from 'convex/values';

// HELPERS
import { fetchOptimized } from '@/convex/helpers/fetchOptimized';
import { apartmentToSearchListing } from '../utils/apartmentToSearchListing';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { SearchListing } from '@/features/accommodations/types/searchListing';

/** Client-stored favorite id lists stay well under this; extras are ignored. */
const MAX_IDS = 200;

/**
 * Paginated saved listings for the guest favorites page.
 *
 * The client passes apartment ids from localStorage; `collect` resolves each row,
 * drops stale/unpublished entries, and `projectPage` maps to the sanitized
 * {@link SearchListing} card shape (no internal fields leak). Offset pagination gives
 * `ConvexDataList` an exact `totalCount`.
 */
export const fetchFavoriteAccommodationsSafe = fetchOptimized({
	table: 'apartments',
	strategy: 'offset',
	args: {
		ids: v.array(v.id('apartments'))
	},
	collect: async (ctx, args) => {
		const docs: Doc<'apartments'>[] = [];
		for (const id of args.ids.slice(0, MAX_IDS)) {
			const apartment = await ctx.db.get('apartments', id);
			if (
				!apartment ||
				apartment.status !== 'published' ||
				apartment.images.length === 0 ||
				apartment.coordinates === undefined
			) {
				continue;
			}
			docs.push(apartment);
		}
		return docs;
	},
	projectPage: (apartment): SearchListing => apartmentToSearchListing(apartment)
});
