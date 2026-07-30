// CONFIG
import { BOOKING_POLICY } from '@/shared/config';

// TYPES
import type { typesBookingPolicySnapshot } from '@/shared/features/booking/types/bookingTypes';

/**
 * The policy snapshot frozen onto every booking at creation (BookingSystemDesign.md §7).
 *
 * Decisions about an EXISTING booking read `booking.policy`, never these live values —
 * changing platform policy must never retroactively move a live booking's cancellation
 * window. Live config is for creating new bookings only.
 */
export function currentBookingPolicySnapshot(): typesBookingPolicySnapshot {
	return {
		freeCancelDays: BOOKING_POLICY.GUEST_FREE_CANCEL_DAYS_BEFORE_CHECKIN,
		hostResponseHours: BOOKING_POLICY.HOST_RESPONSE_HOURS
	};
}
