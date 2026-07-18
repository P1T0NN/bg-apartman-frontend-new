/** Strip query/hash, then drop a trailing slash (except on root) so `/foo` and `/foo/` compare equal. */
function normalizePath(path: string): string {
	const withoutQueryOrHash = path.split(/[?#]/, 1)[0];
	if (withoutQueryOrHash.length > 1 && withoutQueryOrHash.endsWith('/')) {
		return withoutQueryOrHash.slice(0, -1);
	}
	return withoutQueryOrHash;
}

/**
 * Whether a nav link's `href` is active for the current `pathname`. Active on an exact match or when
 * the current path is a descendant (`/host` is active on `/host/reservations`), so a section stays lit
 * on its sub-pages. Root (`/`) only matches exactly — it never lights up on every page.
 *
 * `href` may carry a query/hash (e.g. `/search?location=Beograd`) or a trailing slash; both are
 * normalized away before comparing. Only same-origin app paths qualify — `#`, `javascript:`, `mailto:`,
 * and any scheme/external URL never match. Pass a de-localized pathname so locale prefixes don't skew it.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
	if (!href || href === '#' || /^[a-z][a-z0-9+.-]*:/i.test(href)) return false;

	const target = normalizePath(href);
	const current = normalizePath(pathname);

	if (current === target) return true;
	if (target !== '/' && current.startsWith(`${target}/`)) return true;
	return false;
}
