// UTILS
import { guestMayCancelConfirmed } from '@/shared/features/booking/utils/guestMayCancelConfirmedBooking';
import { todayInPropertyZone } from '@/shared/features/booking/utils/daysUntilCheckIn';

// TYPES
import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';
import type { typesBookingGuestActionOption } from '@/features/bookings/types/bookingsSvelteOnlyTypes';

/**
 * Guest-side actions for the reservation page / my bookings.
 *
 * Same window the mutation enforces (`guestMayPerform`) — a guest never sees a button that
 * would be rejected. Every other status yields no action, and the surface says who to
 * contact instead rather than dead-ending (GuestSystemDesign.md §4).
 */
export function availableBookingGuestActions(b: typesBookingSafe): typesBookingGuestActionOption[] {
	const today = todayInPropertyZone();
	if (b.status === 'pending') {
		return [
			{
				action: 'withdraw',
				meta: { label: 'Withdraw request', toast: 'Request withdrawn', variant: 'outline' }
			}
		];
	}
	if (
		b.status === 'confirmed' &&
		guestMayCancelConfirmed(b.checkInDate, today, b.policy, b.paymentMethod)
	) {
		return [
			{
				action: 'cancel',
				meta: { label: 'Cancel booking', toast: 'Booking cancelled', variant: 'destructive' }
			}
		];
	}
	return [];
}
