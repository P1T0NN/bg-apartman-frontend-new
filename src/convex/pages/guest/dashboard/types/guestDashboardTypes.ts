// Lean payload returned by `fetchGuestDashboardPageSafe`. Only the fields the guest
// dashboard actually renders, so the query stays cheap on bandwidth.

// TYPES
import type { BookingStatus } from '@/features/bookings/types/bookingsTypes';

export type GuestTripSummary = {
	id: string;
	bookingCode: string;
	status: BookingStatus;
	checkInDate: string; // ISO "YYYY-MM-DD"
	checkOutDate: string;
	numberOfAdults: number;
	numberOfChildren: number;
	apartment: { title: string; city: string; imageUrl: string };
};

export type GuestDashboardData = {
	/** Soonest confirmed upcoming trip — the dashboard hero. `null` when there's nothing ahead. */
	nextTrip: GuestTripSummary | null;
	/** Remaining confirmed upcoming trips, capped (the "More upcoming" list). */
	moreUpcoming: GuestTripSummary[];
	counts: {
		/** Confirmed trips still ahead — matches the My bookings "Upcoming" (`?status=confirmed`) filter. */
		upcoming: number;
		/** Past stays — matches the "Checked out" (`?status=checked_out`) filter. */
		checkedOut: number;
	};
};
