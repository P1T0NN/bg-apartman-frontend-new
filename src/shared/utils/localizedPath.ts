import type { RequestEvent } from '@sveltejs/kit';
import { getLocale, localizeUrl } from '@/shared/lib/paraglide/runtime';

/** Canonical path (e.g. `/login`) → current locale prefix (`/de/login` when locale is `de`). */
export function localizedPath(event: RequestEvent, canonicalPath: string) {
	const localized = localizeUrl(new URL(canonicalPath, event.url.origin).href, { locale: getLocale() });
	return `${localized.pathname}${localized.search}`;
}
