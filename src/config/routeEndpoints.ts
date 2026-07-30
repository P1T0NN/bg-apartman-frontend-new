// SVELTEKIT IMPORTS
import { resolve } from '$app/paths';

export const PROTECTED_PAGE_ENDPOINTS = {
	GUEST_DASHBOARD: resolve('/guest/dashboard'),
	GUEST_MY_BOOKINGS: resolve('/guest/my-bookings'),
	GUEST_FAVORITES: resolve('/guest/favorites'),
	HOST_DASHBOARD: resolve('/host/dashboard'),
	HOST_ANALYTICS: resolve('/host/analytics'),
	/** Post-login default — guest dashboard. */
	DASHBOARD: resolve('/guest/dashboard'),
	MY_ACCOMMODATIONS: resolve('/host/my-accommodations'),
	ADD_ACCOMMODATION: resolve('/host/add-accommodation'),
	EDIT_ACCOMMODATION: resolve('/host/my-accommodations/edit-accommodation/:id'),
	/** Per-listing availability calendar — no sidebar entry: a multi-listing host has no
	 *  single calendar (HostSystemDesign.md §2). */
	ACCOMMODATION_CALENDAR: resolve('/host/my-accommodations/:id/calendar'),
	RESERVATIONS: resolve('/host/reservations')
} as const;

export const ADMIN_PAGE_ENDPOINTS = {
	DASHBOARD: resolve('/admin/dashboard'),
	ACCOMMODATIONS: resolve('/admin/accommodations'),
	BOOKINGS: resolve('/admin/bookings'),
	REPORTS: resolve('/admin/reports'),
	USERS: resolve('/admin/users'),
	USER: resolve('/admin/users/:id')
} as const;

export const UNPROTECTED_PAGE_ENDPOINTS = {
	ROOT: '/',
	LOGIN: resolve('/login'),
	SIGNUP: resolve('/signup'),
	FORGOT_PASSWORD: resolve('/forgot-password'),
	ACCOMMODATION: resolve('/accommodation/:slug'),
	BOOK_ACCOMMODATION: resolve('/accommodation/:slug/book'),
	RESERVATION: resolve('/reservations/:id'),
	BOOKING_STATUS_EXPLANATION: resolve('/booking-status-explanation'),
	CONTACT: resolve('/contact'),
	REPORT: resolve('/report')
} as const;
