// UTILS
import { apartmentToSearchAccommodation } from '../utils/apartmentToSearchAccommodation';

// TYPES
import type { QueryCtx } from '@/convex/_generated/server';
import type { Id } from '@/convex/_generated/dataModel';
import type { SearchAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';

/** Client-stored favorite id lists stay well under this; extras are ignored. */
export const MAX_FAVORITE_IDS = 200;

/**
 * Resolve a client-held list of favorite apartment ids into renderable search accommodations.
 *
 * Favorites live in the guest's localStorage (there is no server-side `favorites` table), so
 * there's no index to page against. We point-read each id — bounded to {@link MAX_FAVORITE_IDS}
 * and batched in parallel — drop stale / unpublished / incomplete rows, and preserve the
 * client's order. Returns the full valid set so the caller can offset-paginate it with an
 * exact total. Cost is O(ids) and intentionally capped, never O(table).
 */
export async function resolveFavoriteAccommodations(
	ctx: QueryCtx,
	ids: Id<'apartments'>[]
): Promise<SearchAccommodation[]> {
	const capped = ids.slice(0, MAX_FAVORITE_IDS);
	const docs = await Promise.all(capped.map((id) => ctx.db.get('apartments', id)));

	const accommodations: SearchAccommodation[] = [];
	for (const apartment of docs) {
		if (
			!apartment ||
			apartment.status !== 'published' ||
			apartment.images.length === 0 ||
			apartment.coordinates === undefined
		) {
			continue;
		}
		accommodations.push(apartmentToSearchAccommodation(apartment));
	}
	return accommodations;
}
