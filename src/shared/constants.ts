// SVELTEKIT IMPORTS
import { resolve } from '$app/paths';

export const COMPANY_DATA = {
	NAME: 'Company Name',
	EMAIL: 'company@gmail.com',
	DOMAIN: 'company.com',
	LOGO: '/logo/opt/logo-1536w.webp',
	DESCRIPTION:
		'We build dependable software and services so your team can focus on what matters most.'
} as const;

export const ADMIN_PAGE_ENDPOINTS = {
	DASHBOARD: resolve('/admin/dashboard'),
	USERS: resolve('/admin/users'),
	USER: resolve('/admin/users/:id')
};

export const PROTECTED_PAGE_ENDPOINTS = {
	GUEST_DASHBOARD: resolve('/guest/dashboard'),
	GUEST_MY_BOOKINGS: resolve('/guest/my-bookings'),
	GUEST_FAVORITES: resolve('/guest/favorites'),
	HOST_DASHBOARD: resolve('/host/dashboard'),
	/** Post-login default — host dashboard. */
	DASHBOARD: resolve('/host/dashboard'),
	MY_ACCOMMODATIONS: resolve('/host/my-accommodations'),
	ADD_ACCOMMODATION: resolve('/host/add-accommodation'),
	EDIT_ACCOMMODATION: resolve('/host/my-accommodations/edit-accommodation/:id'),
	BOOKINGS: resolve('/host/bookings')
} as const;

export const UNPROTECTED_PAGE_ENDPOINTS = {
	ROOT: '/',
	LOGIN: resolve('/login'),
	SIGNUP: resolve('/signup'),
	FORGOT_PASSWORD: resolve('/forgot-password'),
	ACCOMMODATION: resolve('/accommodation/:slug'),
	BOOK_ACCOMMODATION: resolve('/accommodation/:slug/book'),
	RESERVATION: resolve('/reservation/:id')
} as const;

/**
 * Fallback IANA zone for a listing's availability calendar — used only when a listing
 * has no stored `timeZone` (rows created before timezone resolution existed, or a
 * failed lookup). Each listing now resolves its own zone from the address pin
 * (coordinates → IANA via `tz-lookup`; see `PlaceDetails.timeZone`), so the calendar
 * runs in the apartment's local day, not the viewer's. Belgrade because the listings
 * to date are Serbian.
 */
export const DEFAULT_TIME_ZONE = 'Europe/Belgrade';

/**
 * Replace `:param` segments in a route pattern (e.g. `/uploaded-files/:id`).
 * Values are passed through `encodeURIComponent`.
 */
export function fillRoutePattern(pattern: string, params: Record<string, string>): string {
	let path = pattern;
	for (const [key, value] of Object.entries(params)) {
		path = path.replace(`:${key}`, encodeURIComponent(value));
	}
	return path;
}
