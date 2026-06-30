// Lean payload returned by `fetchGuestDashboardPageSafe`. Only the fields the guest
// dashboard actually renders, so the query stays cheap on bandwidth.

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { typesBookingApartmentSummary } from '@/shared/features/booking/types/bookingTypes';

export type GuestTripSummary = Pick<
	Doc<'bookings'>,
	'bookingCode' | 'status' | 'checkInDate' | 'checkOutDate' | 'numberOfAdults' | 'numberOfChildren'
> & {
	id: string;
	apartment: Pick<typesBookingApartmentSummary, 'title' | 'city' | 'imageUrl'>;
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
