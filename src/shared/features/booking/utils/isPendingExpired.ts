// UTILS
import { pendingExpiresAtFrom } from '@/shared/features/booking/utils/pendingExpiresAtFrom';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/** True when a pending request is past the host response window. */
export function isPendingExpired(booking: Doc<'bookings'>, now = Date.now()): boolean {
	if (booking.status !== 'pending') return false;
	const deadline = booking.pendingExpiresAt ?? pendingExpiresAtFrom(booking._creationTime);
	return now >= deadline;
}
