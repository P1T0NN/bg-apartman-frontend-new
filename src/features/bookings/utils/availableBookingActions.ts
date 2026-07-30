// UTILS
import { hostMayPerform } from '@/shared/features/booking/utils/hostMayPerform';

// TYPES
import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';
import type { typesBookingActionOption } from '@/features/bookings/types/bookingsSvelteOnlyTypes';

const ACTION_META: Record<'confirm' | 'decline' | 'cancel', typesBookingActionOption> = {
	confirm: {
		action: 'confirm',
		meta: { label: 'Confirm booking', toast: 'Booking confirmed', variant: 'default' }
	},
	decline: {
		action: 'decline',
		meta: { label: 'Decline', toast: 'Request declined', variant: 'destructive' }
	},
	cancel: {
		action: 'cancel',
		meta: { label: 'Cancel booking', toast: 'Booking cancelled', variant: 'destructive' }
	}
};

/**
 * Host-side buttons for a booking, in priority order — driven by the same shared guard the
 * mutations enforce (`hostMayPerform`), so the host never sees a button that would be
 * rejected. Notably: cancel disappears on online bookings inside the free-cancel window —
 * the guest's paid stay is ironclad there (BookingSystemDesign.md §4).
 *
 * check_in / check_out are automatic (booking-lifecycle cron) — never buttons.
 */
export function availableBookingActions(booking: typesBookingSafe): typesBookingActionOption[] {
	return (['confirm', 'decline', 'cancel'] as const)
		.filter((action) => hostMayPerform(action, booking))
		.map((action) => ACTION_META[action]);
}
