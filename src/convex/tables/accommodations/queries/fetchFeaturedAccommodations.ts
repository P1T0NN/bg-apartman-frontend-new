// SERVER
import { query } from '@/convex/_generated/server';

// UTILS
import { apartmentToSearchAccommodation } from '../utils/apartmentToSearchAccommodation';

// TYPES
import type { SearchAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';

/**
 * Public: the homepage "Featured stays" strip.
 *
 * "Safe": returns the sanitized {@link SearchAccommodation} projection (no `hostId`/internal
 * fields), not raw apartment rows — the trim happens in `apartmentToSearchAccommodation`.
 *
 * Performance: reads via the `by_featured` compound index (`isFeatured` + `status`), so the
 * index range scan touches ONLY featured, published rows — never the whole `apartments` table.
 * That set is inherently small (a handful curated by admins), so `.collect()` fetches all of
 * them with no artificial cap: the query stays cheap because the index — not a `.take(n)` — is
 * what bounds the read. If "featured" ever stops being a small curated set, add a `.take(...)`.
 *
 * Only rows with coordinates AND at least one photo are returned — both are required to render a
 * card (and to satisfy `apartmentToSearchAccommodation`, which assumes them).
 */
export const fetchFeaturedAccommodations = query({
	args: {},
	handler: async (ctx): Promise<SearchAccommodation[]> => {
		const featured = await ctx.db
			.query('apartments')
			.withIndex('by_featured', (q) => q.eq('isFeatured', true).eq('status', 'published'))
			.collect();

		return featured
			.filter((a) => a.coordinates !== undefined && a.images.length > 0)
			.map(apartmentToSearchAccommodation);
	}
});
