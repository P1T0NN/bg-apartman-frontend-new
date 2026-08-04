// LIBRARIES
import { api } from '@/convex/_generated/api';
import { createConvexHttpClient } from '@mmailaender/convex-better-auth-svelte/sveltekit';

// TYPES
import type { RequestHandler } from './$types';
import type { SitemapAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';

/**
 * `/sitemap.xml` — the pages worth indexing.
 *
 * A sitemap is a claim that a URL is canonical and worth ranking, so it lists ONLY what
 * `robots.txt` allows and no page that sends `noindex`. That rules out the checkout form,
 * the reservation lookup and confirmation, the auth pages, and everything behind sign-in;
 * what's left is the marketing surface plus one entry per published listing.
 *
 * `<lastmod>` comes from each listing's `updatedAt`, so a re-crawl is triggered by an actual
 * edit rather than by the file being regenerated.
 *
 * A listing read failure degrades to the static pages rather than a 500: a partial sitemap
 * is worth more to a crawler than an error, and the next revalidation picks the rest back up.
 */

/** Static public pages, with a stable priority ordering. Paths only — origin is added below. */
const STATIC_PAGES = [
	{ path: '/', changefreq: 'daily', priority: '1.0' },
	{ path: '/search', changefreq: 'daily', priority: '0.9' },
	{ path: '/contact', changefreq: 'yearly', priority: '0.5' },
	{ path: '/booking-status-explanation', changefreq: 'yearly', priority: '0.3' },
	{ path: '/report', changefreq: 'yearly', priority: '0.2' }
] as const;

/** XML text escaping. Slugs are URL-safe today, but a sitemap must not be corruptible by data. */
function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function urlEntry(loc: string, lastmod?: string, changefreq?: string, priority?: string): string {
	return [
		'\t<url>',
		`\t\t<loc>${escapeXml(loc)}</loc>`,
		lastmod ? `\t\t<lastmod>${lastmod}</lastmod>` : null,
		changefreq ? `\t\t<changefreq>${changefreq}</changefreq>` : null,
		priority ? `\t\t<priority>${priority}</priority>` : null,
		'\t</url>'
	]
		.filter(Boolean)
		.join('\n');
}

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const origin = url.origin;

	let listings: SitemapAccommodation[] = [];
	try {
		listings = await createConvexHttpClient().query(
			api.tables.accommodations.queries.fetchSitemapAccommodations.fetchSitemapAccommodations,
			{}
		);
	} catch (error) {
		console.error('[sitemap] listing read failed — serving static pages only', error);
	}

	const entries = [
		...STATIC_PAGES.map((page) =>
			urlEntry(new URL(page.path, origin).href, undefined, page.changefreq, page.priority)
		),
		...listings.map((listing) =>
			urlEntry(
				new URL(`/accommodation/${encodeURIComponent(listing.slug)}`, origin).href,
				new Date(listing.updatedAt).toISOString().slice(0, 10),
				'weekly',
				'0.8'
			)
		)
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

	setHeaders({
		'Content-Type': 'application/xml; charset=utf-8',
		// Crawlers re-fetch often; regenerating per hit would read the listings table each time.
		'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
	});

	return new Response(body);
};
