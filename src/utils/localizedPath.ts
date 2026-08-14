// TYPES
import type { RequestEvent } from '@sveltejs/kit';

// UTILS
import { appHref } from '@/utils/app-navigation';

/**
 * Resolve a canonical route path against the request origin, localized for the
 * request's locale (server-side sibling of `appHref`; cookie-only areas are left
 * canonical by the same COOKIE_ONLY_PREFIXES guard).
 */
export function localizedPath(event: RequestEvent, canonicalPath: string) {
	const url = new URL(appHref(canonicalPath), event.url.origin);
	return `${url.pathname}${url.search}`;
}
