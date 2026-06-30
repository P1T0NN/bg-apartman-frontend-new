// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { typesBookingAction } from '@/shared/features/booking/types/bookingTypes';

export function hostMayPerform(
	action: typesBookingAction,
	booking: Doc<'bookings'>
): boolean {
	switch (action) {
		case 'confirm':
		case 'decline':
			return booking.status === 'pending';
		case 'check_in':
			return booking.status === 'confirmed';
		case 'check_out':
			return booking.status === 'checked_in';
		case 'cancel':
			return booking.status === 'confirmed';
	}
}
