// TYPES
import type { RequestHandler } from './$types';

/**
 * `robots.txt`, served dynamically rather than from `static/` so the `Sitemap:` line can be
 * an absolute URL on whatever host is serving — production, a preview deploy, or localhost —
 * without a hardcoded domain or a build-time env var.
 *
 * What is disallowed and why:
 *   - the signed-in areas (`/guest`, `/host`, `/admin`) — private, and every page in them
 *     already sends `noindex`. This stops crawlers spending budget discovering them at all;
 *   - `/reservations*` — a guest's booking lookup and confirmation. Not secret exactly, but
 *     keyed by booking code and of no value in an index;
 *   - the per-listing checkout form — the listing page above it is the canonical, indexable
 *     URL; the form is a duplicate with no standalone content;
 *   - `/login`, `/signup`, `/forgot-password` — auth plumbing, nothing to rank.
 *
 * NOT disallowed on purpose: `/search`. Its query strings are crawler bait, but blocking it
 * would also block the internal-link path to every listing. The listing pages are in the
 * sitemap, so discovery does not depend on crawling search results.
 */
export const GET: RequestHandler = ({ url }) => {
	const body = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Signed-in areas — private, and noindex on every page.
Disallow: /guest/
Disallow: /host/
Disallow: /admin/

# Booking lookup and confirmation — keyed by booking code, nothing to index.
Disallow: /reservations
Disallow: /reservations/

# Checkout form — the listing page is the canonical URL.
Disallow: /accommodation/*/book

# Auth plumbing.
Disallow: /login
Disallow: /signup
Disallow: /forgot-password

# Auth + internal endpoints.
Disallow: /api/

Sitemap: ${new URL('/sitemap.xml', url.origin).href}
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			// Rarely changes, and a stale robots.txt for an hour is harmless.
			'Cache-Control': 'public, max-age=0, s-maxage=3600'
		}
	});
};
