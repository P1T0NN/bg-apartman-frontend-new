// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// HELPERS
import { resolveReservationBooking } from '@/convex/tables/bookings/helpers/resolveReservationBooking';

// SCHEMAS
import { paymentMethod } from '@/convex/tables/accommodations/schemas/accommodationsSchemas';
import { bookingStatus } from '@/convex/tables/bookings/schemas/bookingsSchemas';

// TYPES
import type { typesReservationBooking } from '@/shared/features/booking/types/bookingTypes';

const reservationBooking = v.object({
	bookingCode: v.string(),
	guestEmail: v.string(),
	checkInDate: v.string(),
	checkOutDate: v.string(),
	numberOfAdults: v.number(),
	numberOfChildren: v.number(),
	paymentMethod,
	status: bookingStatus,
	total: v.number(),
	apartmentTitle: v.string(),
	apartmentSlug: v.string(),
	hostName: v.string()
});

/**
 * Public single-booking fetch for `/reservations/[id]`.
 *
 * The booking id is the unguessable access key handed to the guest after checkout, so
 * anyone with the link can view the reservation (no account required). Returns `null`
 * for a missing id so the page renders a not-found state instead of throwing.
 */
export const fetchBookingById = query({
	args: { id: v.id('bookings') },
	returns: v.union(reservationBooking, v.null()),
	handler: async (ctx, { id }): Promise<typesReservationBooking | null> => {
		const booking = await ctx.db.get(id);
		if (!booking) return null;
		return await resolveReservationBooking(ctx, booking);
	}
});
