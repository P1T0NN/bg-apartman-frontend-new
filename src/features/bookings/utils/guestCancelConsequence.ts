// I18N
import { m } from '@/lib/paraglide/messages';

// UTILS
import { isLateCancellation } from '@/shared/features/booking/utils/guestMayCancelConfirmedBooking';
import { todayInPropertyZone } from '@/shared/features/booking/utils/daysUntilCheckIn';

// TYPES
import type { typesBookingPolicySnapshot } from '@/shared/features/booking/types/bookingTypes';

/**
 * What the guest is told before confirming a cancellation, stated from the booking's own
 * policy snapshot (GuestSystemDesign.md §4). The copy names the concrete consequence and
 * stops there.
 *
 * A cash booking inside the window never gets here — its cancel button doesn't render
 * (BookingSystemDesign.md §4: the window is closed) — so the only late variant is online.
 */
export function guestCancelConsequence(
	checkInDate: string,
	policy: typesBookingPolicySnapshot,
	paymentMethod: 'cash' | 'online'
): string {
	const isLate = isLateCancellation(checkInDate, todayInPropertyZone(), policy);

	if (!isLate) {
		return paymentMethod === 'online'
			? m['guestCancelConsequence.freeCancelOnline']({ freeCancelDays: policy.freeCancelDays })
			: m['guestCancelConsequence.freeCancelCash']({ freeCancelDays: policy.freeCancelDays });
	}

	return m['guestCancelConsequence.lateCancel']({ freeCancelDays: policy.freeCancelDays });
}
