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
		paymentStatus: booking.paymentStatus,
		status: booking.status,
		total: booking.total,
		// The window this booking lives under — the cancel dialog states the consequence
		// from it, never from live config (BookingSystemDesign.md §0.3).
		policy: booking.policy,
		cancelledBy: booking.cancelledBy,
		cancelReason: booking.cancelReason,
		stayConfirmationRequestedAt: booking.stayConfirmationRequestedAt,
		stayConfirmedAt: booking.stayConfirmedAt,
		apartmentTitle: apartment?.title ?? 'Stay',
		apartmentSlug: booking.apartmentSlug,
		// Drives "Book again": a delisted stay must not send the guest to a dead page
		// (GuestSystemDesign.md §3).
		apartmentIsBookable: apartment?.status === 'published',
		hostName: host?.name?.trim() || 'Host'
	};
}
