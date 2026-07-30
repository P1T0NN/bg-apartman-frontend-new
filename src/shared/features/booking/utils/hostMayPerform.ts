// UTILS
import { hostMayCancelConfirmed } from '@/shared/features/booking/utils/guestMayCancelConfirmedBooking';
import { todayInPropertyZone } from '@/shared/features/booking/utils/daysUntilCheckIn';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { typesBookingAction } from '@/shared/features/booking/types/bookingTypes';

/** The slice the guard reads — satisfied by `Doc<'bookings'>` and `typesBookingSafe` alike. */
type BookingGuardSlice = Pick<
	Doc<'bookings'>,
	| 'status'
	| 'checkInDate'
	| 'policy'
	| 'paymentMethod'
	| 'stayConfirmationRequestedAt'
	| 'stayConfirmedAt'
>;

/**
 * The single source of truth for which host action a booking allows — rendered by the UI
 * and re-enforced by the mutation (BookingSystemDesign.md I5).
 */
export function hostMayPerform(
	action: typesBookingAction,
	booking: BookingGuardSlice,
	now = Date.now()
): boolean {
	switch (action) {
		case 'confirm':
		case 'decline':
			return booking.status === 'pending';
		case 'cancel':
			// Cash: outside the window free; inside it only with a provably ignored stay
			// confirmation. Online: closes at the cutoff — the paid stay is ironclad (BSD §4/§11).
			return (
				booking.status === 'confirmed' &&
				hostMayCancelConfirmed(booking, todayInPropertyZone(now), now)
			);
	}
}
