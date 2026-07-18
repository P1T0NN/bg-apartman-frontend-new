// HELPERS
import { resolveApartmentSummary } from '@/convex/tables/bookings/helpers/resolveApartmentSummary';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { QueryCtx } from '@/convex/_generated/server';
import type { GuestTripSummary } from '@/convex/pages/guest/dashboard/types/guestDashboardTypes';

/** Map a booking row to the lean trip card shape the guest dashboard renders. */
export async function bookingToGuestTripSummary(
	ctx: QueryCtx,
	booking: Doc<'bookings'>
): Promise<GuestTripSummary> {
	const apartment = await resolveApartmentSummary(ctx, booking);

	return {
		id: booking._id,
		bookingCode: booking.bookingCode,
		status: booking.status,
		checkInDate: booking.checkInDate,
		checkOutDate: booking.checkOutDate,
		numberOfAdults: booking.numberOfAdults,
		numberOfChildren: booking.numberOfChildren,
		apartment
	};
}
