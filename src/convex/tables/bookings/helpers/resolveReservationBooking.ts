// UTILS
import { authComponent } from '@/convex/auth/auth';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { QueryCtx } from '@/convex/_generated/server';
import type { typesReservationBooking } from '@/shared/features/booking/types/bookingTypes';

/** Public reservation-page payload: booking facts + accommodation/host labels for the UI. */
export async function resolveReservationBooking(
	ctx: QueryCtx,
	booking: Doc<'bookings'>
): Promise<typesReservationBooking> {
	const apartment = booking.apartmentId
		? await ctx.db.get(booking.apartmentId)
		: await ctx.db
				.query('apartments')
				.withIndex('by_slug', (q) => q.eq('slug', booking.apartmentSlug))
				.first();

	const host = await authComponent.getAnyUserById(ctx, booking.hostId);

	return {
		bookingCode: booking.bookingCode,
		guestEmail: booking.guestEmail,
		checkInDate: booking.checkInDate,
		checkOutDate: booking.checkOutDate,
		numberOfAdults: booking.numberOfAdults,
		numberOfChildren: booking.numberOfChildren,
		paymentMethod: booking.paymentMethod,
		status: booking.status,
		total: booking.total,
		apartmentTitle: apartment?.title ?? 'Stay',
		apartmentSlug: booking.apartmentSlug,
		hostName: host?.name?.trim() || 'Host'
	};
}
