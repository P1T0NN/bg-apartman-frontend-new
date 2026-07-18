// TYPES
import type { typesBookingSafe, typesGuestBookingAction } from '@/shared/features/booking/types/bookingTypes';

export function applyGuestBookingAction(
	b: typesBookingSafe,
	action: typesGuestBookingAction
): typesBookingSafe {
	const now = Date.now();
	if (action === 'withdraw') {
		return {
			...b,
			status: 'cancelled',
			cancelledBy: 'guest',
			cancelledAt: now,
			cancelReason: 'Withdrawn by guest.',
			updatedAt: now
		};
	}
	return {
		...b,
		status: 'cancelled',
		cancelledBy: 'guest',
		cancelledAt: now,
		cancelReason: 'Cancelled by guest.',
		updatedAt: now
	};
}
