// SVELTEKIT IMPORTS
import { resolve } from '$app/paths';

export const PROTECTED_PAGE_ENDPOINTS = {
	GUEST_DASHBOARD: resolve('/guest/dashboard'),
	GUEST_MY_BOOKINGS: resolve('/guest/my-bookings'),
	GUEST_FAVORITES: resolve('/guest/favorites'),
	HOST_DASHBOARD: resolve('/host/dashboard'),
	/** Post-login default — guest dashboard. */
	DASHBOARD: resolve('/guest/dashboard'),
	MY_ACCOMMODATIONS: resolve('/host/my-accommodations'),
	ADD_ACCOMMODATION: resolve('/host/add-accommodation'),
	EDIT_ACCOMMODATION: resolve('/host/my-accommodations/edit-accommodation/:id'),
	RESERVATIONS: resolve('/host/reservations')
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
