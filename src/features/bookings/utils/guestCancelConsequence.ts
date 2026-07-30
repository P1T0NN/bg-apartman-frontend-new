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
			? `Free cancellation — you're at least ${policy.freeCancelDays} days before check-in, so you'll be refunded in full. The host is notified and the dates reopen straight away.`
			: `Free cancellation — you're at least ${policy.freeCancelDays} days before check-in. Nothing was charged; the host is notified and the dates reopen straight away.`;
	}

	return `This is less than ${policy.freeCancelDays} days before check-in, so it counts as a late cancellation and your payment won't be refunded.`;
}
