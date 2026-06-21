// SVELTEKIT IMPORTS
import { resolve } from "$app/paths";

export const COMPANY_DATA = {
	NAME: 'Company Name',
	EMAIL: 'company@gmail.com',
    DOMAIN: 'company.com',
	LOGO: '/logo/logo.webp',
	DESCRIPTION: 'We build dependable software and services so your team can focus on what matters most.'
} as const;

export const ADMIN_PAGE_ENDPOINTS = {
    DASHBOARD: resolve("/admin/dashboard"),
    USERS: resolve("/admin/users"),
    USER: resolve("/admin/users/:id")
}

export const PROTECTED_PAGE_ENDPOINTS = {
    DASHBOARD: resolve("/dashboard"),
    MY_ACCOMMODATIONS: resolve("/my-accommodations"),
    ADD_ACCOMMODATION: resolve("/add-accommodation"),
    BOOKINGS: resolve("/bookings")
} as const;

export const UNPROTECTED_PAGE_ENDPOINTS = {
    ROOT: "/",
    LOGIN: resolve("/login"),
    SIGNUP: resolve("/signup"),
    FORGOT_PASSWORD: resolve("/forgot-password"),
} as const;

/**
 * Replace `:param` segments in a route pattern (e.g. `/uploaded-files/:id`).
 * Values are passed through `encodeURIComponent`.
 */
export function fillRoutePattern(
	pattern: string,
	params: Record<string, string>
): string {
	let path = pattern;
	for (const [key, value] of Object.entries(params)) {
		path = path.replace(`:${key}`, encodeURIComponent(value));
	}
	return path;
}