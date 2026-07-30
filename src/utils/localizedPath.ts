// TYPES
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Resolve a canonical route path against the request origin. The app is English-only, so this
 * is a straight passthrough of the path + query — kept as a seam so redirects have one place
 * to change if locale prefixes ever come back.
 */
export function localizedPath(event: RequestEvent, canonicalPath: string) {
	const url = new URL(canonicalPath, event.url.origin);
	return `${url.pathname}${url.search}`;
}
