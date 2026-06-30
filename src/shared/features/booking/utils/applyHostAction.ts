// UTILS
import { hostMayPerform } from '@/shared/features/booking/utils/hostMayPerform';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type {
	typesBookingAction,
	typesBookingTransitionPatch
} from '@/shared/features/booking/types/bookingTypes';

export function applyHostAction(
	booking: Doc<'bookings'>,
	action: typesBookingAction,
	now = Date.now()
): typesBookingTransitionPatch | null {
	if (!hostMayPerform(action, booking)) return null;

	switch (action) {
		case 'confirm':
			return { status: 'confirmed', updatedAt: now, pendingExpiresAt: undefined };
		case 'decline':
			return {
				status: 'declined',
				updatedAt: now,
				cancelReason: 'Declined by host.'
			};
		case 'check_in':
			return { status: 'checked_in', updatedAt: now };
		case 'check_out':
			return { status: 'checked_out', updatedAt: now };
		case 'cancel':
			return {
				status: 'cancelled',
				updatedAt: now,
				cancelledAt: now,
				cancelledBy: 'host',
				cancelReason: 'Cancelled by host.'
			};
	}
}
