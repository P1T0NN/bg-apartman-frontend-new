// CONFIG
import { BOOKING_POLICY } from '@/shared/features/booking/config';

// UTILS
import { daysUntilCheckIn } from '@/shared/features/booking/utils/daysUntilCheckIn';

export function guestMayCancelConfirmed(checkInDate: string, today: string): boolean {
	return (
		daysUntilCheckIn(checkInDate, today) >= BOOKING_POLICY.GUEST_FREE_CANCEL_DAYS_BEFORE_CHECKIN
	);
}
