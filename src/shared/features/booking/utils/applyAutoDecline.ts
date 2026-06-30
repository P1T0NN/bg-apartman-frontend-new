// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { typesBookingTransitionPatch } from '@/shared/features/booking/types/bookingTypes';

export function applyAutoDecline(
	booking: Doc<'bookings'>,
	now = Date.now()
): typesBookingTransitionPatch | null {
	if (booking.status !== 'pending') return null;
	return {
		status: 'auto_declined',
		updatedAt: now,
		cancelReason: 'Request expired — host did not respond in time.'
	};
}
