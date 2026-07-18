// TYPES
import type { typesBookingStatus } from '@/shared/features/booking/types/bookingTypes';
import type { typesBookingActionOption } from '@/features/bookings/types/bookingsSvelteOnlyTypes';

/** Host-side buttons for a booking status, in priority order. */
export function availableBookingActions(status: typesBookingStatus): typesBookingActionOption[] {
	switch (status) {
		case 'pending':
			return [
				{
					action: 'confirm',
					meta: { label: 'Confirm booking', toast: 'Booking confirmed', variant: 'default' }
				},
				{
					action: 'decline',
					meta: { label: 'Decline', toast: 'Request declined', variant: 'destructive' }
				}
			];
		case 'confirmed':
			// check_in / check_out are automatic (see booking-lifecycle cron) — no manual buttons.
			return [
				{
					action: 'cancel',
					meta: { label: 'Cancel booking', toast: 'Booking cancelled', variant: 'destructive' }
				}
			];
		default:
			return [];
	}
}
