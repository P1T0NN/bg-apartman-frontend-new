// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type {
	typesGuestBookingAction,
	typesBookingTransitionPatch
} from '@/shared/features/booking/types/bookingTypes';
import { guestMayPerform } from '@/shared/features/booking/utils/guestMayPerform';

export function applyGuestAction(
	booking: Doc<'bookings'>,
	action: typesGuestBookingAction,
	now = Date.now()
): typesBookingTransitionPatch | null {
	if (!guestMayPerform(action, booking, now)) return null;

	switch (action) {
		case 'withdraw':
			return {
				status: 'cancelled',
				updatedAt: now,
				cancelledAt: now,
				cancelledBy: 'guest',
				cancelReason: 'Withdrawn by guest.',
				pendingExpiresAt: undefined
			};
		case 'cancel':
			return {
				status: 'cancelled',
				updatedAt: now,
				cancelledAt: now,
				cancelledBy: 'guest',
				cancelReason: 'Cancelled by guest.'
			};
	}
}
