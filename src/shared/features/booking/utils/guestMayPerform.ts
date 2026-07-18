// UTILS
import { guestMayCancelConfirmed } from '@/shared/features/booking/utils/guestMayCancelConfirmedBooking';
import { todayIsoUtc } from '@/shared/features/booking/utils/daysUntilCheckIn';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { typesGuestBookingAction } from '@/shared/features/booking/types/bookingTypes';

export function guestMayPerform(
	action: typesGuestBookingAction,
	booking: Doc<'bookings'>,
	now = Date.now()
): boolean {
	const today = todayIsoUtc(now);
	switch (action) {
		case 'withdraw':
			return booking.status === 'pending';
		case 'cancel':
			return booking.status === 'confirmed' && guestMayCancelConfirmed(booking.checkInDate, today);
	}
}
