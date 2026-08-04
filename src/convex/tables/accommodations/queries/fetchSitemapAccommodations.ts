// LIBRARIES
import { query } from '@/convex/_generated/server';

// CONFIG
import { OPERATIONAL_LIMITS } from '@/shared/config';

// TYPES
import type { SitemapAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';

/**
 * Public: the URL list behind `/sitemap.xml`.
 *
 * Published listings only — the sitemap is a statement that a URL is worth indexing, and
 * pending/suspended/expired/archived listings all render as not-found to a crawler. Emitting
 * them would be asking Google to index 404s.
 *
 * Returns `{ slug, updatedAt }` and nothing else. Convex has no column projection, so the
 * documents themselves are read whole (images, description, amenities) — which is exactly
 * why this is capped rather than collected. `/sitemap.xml` sets a long `s-maxage`, so in
 * practice this runs on the order of once a day, not once per crawl.
 *
 * ⚠️ Past `SITEMAP_MAX_URLS` the sitemap silently stops listing new listings. The protocol
 * limit is 50,000 URLs per file; if the catalogue ever approaches this cap, split into a
 * sitemap index with paginated child sitemaps rather than just raising it.
 */
export const fetchSitemapAccommodations = query({
	args: {},
	handler: async (ctx): Promise<SitemapAccommodation[]> => {
		const published = await ctx.db
			.query('apartments')
			.withIndex('by_status', (q) => q.eq('status', 'published'))
			.take(OPERATIONAL_LIMITS.SITEMAP_MAX_URLS);

		if (published.length >= OPERATIONAL_LIMITS.SITEMAP_MAX_URLS) {
			console.warn('[fetchSitemapAccommodations] URL cap reached — newer listings are unlisted', {
				cap: OPERATIONAL_LIMITS.SITEMAP_MAX_URLS
			});
		}

		// `updatedAt` is required on the row and stamped on every edit, so it is always a real
		// last-modified date — which is what makes `<lastmod>` meaningful to a crawler.
		return published.map((apartment) => ({
			slug: apartment.slug,
			updatedAt: apartment.updatedAt
		}));
	}
});
