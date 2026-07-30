// LIBRARIES
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

/** Canonical app path → locale-aware SvelteKit href (e.g. `/demo` → `/sr/demo`). */
export function appHref(href: string): string {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return resolve(href as any);
}

/** Navigate to a canonical app path with locale prefix applied when needed. */
export function appGoto(href: string, opts?: Parameters<typeof goto>[1]) {
	return goto(appHref(href), opts);
}
