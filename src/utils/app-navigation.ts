// LIBRARIES
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

// I18N
import { localizeHref } from '@/lib/paraglide/runtime';

/**
 * Signed-in areas resolve the locale from the PARAGLIDE_LOCALE cookie — never a URL
 * prefix. Mirrors the `routeStrategies` in vite.config.ts (host/guest/admin).
 */
const COOKIE_ONLY_PREFIXES = ['/host', '/guest', '/admin'];

/** Canonical app path → locale-aware SvelteKit href (e.g. `/demo` → `/sr/demo`). */
export function appHref(href: string): string {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const resolved = resolve(href as any);
	if (COOKIE_ONLY_PREFIXES.some((p) => resolved === p || resolved.startsWith(`${p}/`))) {
		return resolved;
	}
	return localizeHref(resolved);
}

/** Navigate to a canonical app path with locale prefix applied when needed. */
export function appGoto(href: string, opts?: Parameters<typeof goto>[1]) {
	return goto(appHref(href), opts);
}
