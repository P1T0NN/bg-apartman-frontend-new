// UTILS
import { guestMayPerform } from '@/shared/features/booking/utils/guestMayPerform';
import { isLateCancellation } from '@/shared/features/booking/utils/guestMayCancelConfirmedBooking';
import { todayInPropertyZone } from '@/shared/features/booking/utils/daysUntilCheckIn';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type {
	typesGuestBookingAction,
	typesBookingTransitionPatch
} from '@/shared/features/booking/types/bookingTypes';

/**
 * The row update a guest action produces. Returns `null` when the action isn't allowed, so
 * the mutation and the UI share one gate (BookingSystemDesign.md I5).
 */
export function applyGuestAction(
	booking: Doc<'bookings'>,
	action: typesGuestBookingAction,
	now = Date.now()
): typesBookingTransitionPatch | null {
	if (!guestMayPerform(action, booking, now)) return null;

	switch (action) {
		case 'withdraw':
			// Its own terminal status, NOT `cancelled` — pulling a request the host never
			// answered is a non-event, and collapsing the two poisons every downstream list,
			// count and stat (BookingSystemDesign.md §2).
			return {
				status: 'withdrawn',
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
				cancelReason: 'Cancelled by guest.',
				// From the booking's own frozen policy. Only online bookings can reach a late
				// cancel (the cash window closes at the cutoff — guestMayCancelConfirmed), and
				// for them the flag means the capture is kept (BookingSystemDesign.md §4).
				lateCancellation: isLateCancellation(
					booking.checkInDate,
					todayInPropertyZone(now),
					booking.policy
				)
			};
	}
}
