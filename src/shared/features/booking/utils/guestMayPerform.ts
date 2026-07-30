// UTILS
import { guestMayCancelConfirmed } from '@/shared/features/booking/utils/guestMayCancelConfirmedBooking';
import { todayInPropertyZone } from '@/shared/features/booking/utils/daysUntilCheckIn';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { typesGuestBookingAction } from '@/shared/features/booking/types/bookingTypes';

/** The slice the guard reads — satisfied by `Doc<'bookings'>` and `typesBookingSafe` alike. */
type BookingGuardSlice = Pick<
	Doc<'bookings'>,
	'status' | 'checkInDate' | 'policy' | 'paymentMethod'
>;

/**
 * The single source of truth for which guest action a booking allows — rendered by the UI
 * and re-enforced by the mutation, so a guest never sees a button that will be rejected
 * (BookingSystemDesign.md I5).
 */
export function guestMayPerform(
	action: typesGuestBookingAction,
	booking: BookingGuardSlice,
	now = Date.now()
): boolean {
	const today = todayInPropertyZone(now);
	switch (action) {
		case 'withdraw':
			return booking.status === 'pending';
		case 'cancel':
			return (
				booking.status === 'confirmed' &&
				guestMayCancelConfirmed(booking.checkInDate, today, booking.policy, booking.paymentMethod)
			);
	}
}
