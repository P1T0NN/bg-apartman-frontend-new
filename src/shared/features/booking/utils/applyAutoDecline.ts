// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { typesBookingTransitionPatch } from '@/shared/features/booking/types/bookingTypes';

/** Machine-readable causes, mirrored by the guest email's copy variants. */
const AUTO_DECLINE_REASON = {
	expired: 'Request expired — host did not respond in time.',
	dates_taken: 'The host confirmed another request for these dates.'
} as const;

export type typesAutoDeclineReason = keyof typeof AUTO_DECLINE_REASON;

/**
 * System-driven end of a pending request (BookingSystemDesign.md §2/§6) — either the 48h
 * window lapsed, or the host confirmed a competing request for the same nights.
 *
 * Stamps `cancelledBy: 'system'` alongside the status so no terminal row exists without
 * the evidence of how it got there (invariant I2), and clears the now-meaningless
 * response deadline.
 */
export function applyAutoDecline(
	booking: Doc<'bookings'>,
	reason: typesAutoDeclineReason = 'expired',
	now = Date.now()
): typesBookingTransitionPatch | null {
	if (booking.status !== 'pending') return null;
	return {
		status: 'auto_declined',
		updatedAt: now,
		cancelledAt: now,
		cancelledBy: 'system',
		cancelReason: AUTO_DECLINE_REASON[reason],
		pendingExpiresAt: undefined
	};
}
