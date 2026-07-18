// UTILS
import { guestMayCancelConfirmed } from '@/shared/features/booking/utils/guestMayCancelConfirmedBooking';
import { todayIsoUtc } from '@/shared/features/booking/utils/daysUntilCheckIn';

// TYPES
import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';
import type { typesBookingGuestActionOption } from '@/features/bookings/types/bookingsSvelteOnlyTypes';

/** Guest-side actions for the reservation page / my bookings. */
export function availableBookingGuestActions(
	b: typesBookingSafe
): typesBookingGuestActionOption[] {
	const today = todayIsoUtc();
	if (b.status === 'pending') {
		return [
			{
				action: 'withdraw',
				meta: { label: 'Withdraw request', toast: 'Request withdrawn', variant: 'outline' }
			}
		];
	}
	if (b.status === 'confirmed' && guestMayCancelConfirmed(b.checkInDate, today)) {
		return [
			{
				action: 'cancel',
				meta: { label: 'Cancel booking', toast: 'Booking cancelled', variant: 'destructive' }
			}
		];
	}
	return [];
}
