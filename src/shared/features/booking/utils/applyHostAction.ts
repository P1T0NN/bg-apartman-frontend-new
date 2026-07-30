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
			// Terminal and actor-driven, so it carries its evidence like every other one
			// (BookingSystemDesign.md I2). Callers overwrite `cancelReason` with the host's
			// own words — the guest reads it.
			return {
				status: 'declined',
				updatedAt: now,
				cancelledAt: now,
				cancelledBy: 'host',
				cancelReason: 'Declined by host.',
				pendingExpiresAt: undefined
			};
		case 'cancel':
			// Like decline, the caller overwrites `cancelReason` with the host's own words
			// (mandatory — cancelBookingOwnerSchema); this string is only the fallback shape.
			return {
				status: 'cancelled',
				updatedAt: now,
				cancelledAt: now,
				cancelledBy: 'host',
				cancelReason: 'Cancelled by host.'
			};
	}
}
