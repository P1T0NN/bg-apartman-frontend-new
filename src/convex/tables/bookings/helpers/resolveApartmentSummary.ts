// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { QueryCtx } from '@/convex/_generated/server';
import type { typesBookingApartmentSummary } from '@/shared/features/booking/types/bookingTypes';

/** Join a booking to the lean apartment summary the bookings UI renders. */
export async function resolveApartmentSummary(
	ctx: QueryCtx,
	booking: Doc<'bookings'>
): Promise<typesBookingApartmentSummary> {
	const apartment = booking.apartmentId
		? await ctx.db.get(booking.apartmentId)
		: await ctx.db
				.query('apartments')
				.withIndex('by_slug', (q) => q.eq('slug', booking.apartmentSlug))
				.first();

	return {
		_id: apartment?._id ?? booking.apartmentSlug,
		title: apartment?.title ?? 'Stay',
		city: apartment?.city ?? '',
		type: apartment?.type ?? '',
		imageUrl: apartment?.images?.[0]?.url ?? ''
	};
}
