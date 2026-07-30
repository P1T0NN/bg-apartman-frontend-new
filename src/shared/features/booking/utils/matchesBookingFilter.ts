// DATA
import { CLOSED_BOOKING_STATUSES } from '@/shared/features/booking/data/bookingsData';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { typesBookingTabFilter } from '@/shared/features/booking/types/bookingTypes';

/**
 * Does a booking belong under the given tab? The "cancelled" tab is the closed bucket —
 * declined, auto-declined and withdrawn land there too, so no closed booking is
 * unreachable.
 */
export function matchesBookingFilter(
	booking: Doc<'bookings'>,
	filter: typesBookingTabFilter
): boolean {
	if (filter === 'cancelled') return CLOSED_BOOKING_STATUSES.has(booking.status);
	return booking.status === filter;
}
