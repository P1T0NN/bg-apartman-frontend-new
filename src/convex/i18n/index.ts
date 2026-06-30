/**
 * Server-side translations for the Convex transactional emails. Self-contained, email-only catalog
 * (`./messages/{locale}.json`) — deliberately NOT the global Paraglide UI catalog, so Convex bundles
 * only these few strings, not the whole app's copy, and never the Paraglide client runtime.
 *
 * Plain JSON: each top-level key is one email (`createBooking`, `createAccommodation`, plus shared
 * `footer`). Author copy there with the `{param}` convention; `t()` interpolates it.
 */

import en from './messages/en.json';
import sr from './messages/sr.json';

export type Locale = 'en' | 'sr';

/** Map any incoming locale string to a supported one; unknown/missing → base `en`. */
export const pickLocale = (locale: string): Locale => (locale === 'sr' ? 'sr' : 'en');

const catalogs: Record<Locale, unknown> = { en, sr };

/** Walk a dot-path (`booking.headingConfirmed`) into a catalog; returns the string or undefined. */
function lookup(catalog: unknown, key: string): string | undefined {
	const value = key.split('.').reduce<unknown>((node, part) => {
		return node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined;
	}, catalog);
	return typeof value === 'string' ? value : undefined;
}

/**
 * Translate one message key with `{param}` interpolation. Falls back to English per key (sr.json may
 * be partial), then to the raw key so a typo shows up in the output instead of failing silently.
 */
export function t(
	locale: string,
	key: string,
	params: Record<string, string | number> = {}
): string {
	const raw = lookup(catalogs[pickLocale(locale)], key) ?? lookup(en, key) ?? key;
	return raw.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
}
