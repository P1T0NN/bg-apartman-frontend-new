// UTILS
import { daysUntilCheckIn } from '@/shared/features/booking/utils/daysUntilCheckIn';
import {
	stayConfirmationUnlocksCancel,
	type typesStayConfirmationSlice
} from '@/shared/features/booking/utils/stayConfirmation';

// TYPES
import type { typesBookingPolicySnapshot } from '@/shared/features/booking/types/bookingTypes';

/**
 * May the guest still self-cancel a confirmed stay? (BookingSystemDesign.md §4)
 *
 * The window splits by payment method because the host's protection differs:
 *
 * - **cash** — closes at the free-cancel cutoff (`policy.freeCancelDays` before check-in).
 *   A late cash cancel can't be compensated — nothing is collectable — so cancellation
 *   rights end where compensation ends. Inside the window the booking is a commitment.
 * - **online** — open until the day BEFORE check-in. Inside the free window the payment is
 *   forfeited ({@link isLateCancellation}), so the host is made whole either way and gets
 *   the dates back to resell — no reason to forbid it.
 *
 * Both read the booking's OWN policy snapshot, never live config
 * (BookingSystemDesign.md §0.3). Self-serve always closes on check-in day.
 */
export function guestMayCancelConfirmed(
	checkInDate: string,
	today: string,
	policy: typesBookingPolicySnapshot,
	paymentMethod: 'cash' | 'online'
): boolean {
	const days = daysUntilCheckIn(checkInDate, today);
	return paymentMethod === 'cash' ? days >= policy.freeCancelDays : days > 0;
}

/** The slice the host-cancel guard reads — satisfied by `Doc<'bookings'>` and the safe types. */
export type typesHostCancelSlice = {
	checkInDate: string;
	policy: typesBookingPolicySnapshot;
	paymentMethod: 'cash' | 'online';
} & typesStayConfirmationSlice;

/**
 * May the HOST still cancel a confirmed stay? (BookingSystemDesign.md §4/§11)
 *
 * The mirror of {@link guestMayCancelConfirmed} — the same boundary locks in whoever bears
 * the risk:
 *
 * - **cash, outside the window** — open, no questions.
 * - **cash, inside the window** — only with PROOF of an unresponsive guest: an in-product
 *   stay-confirmation request that has sat unanswered for the unlock window
 *   ({@link stayConfirmationUnlocksCancel}). The escape valve for a likely no-show, made
 *   unabusable: no timestamped ignored request, no cancel.
 * - **online** — closes at the free-cancel cutoff. Inside it the guest's PAID booking is
 *   ironclad: only the guest (forfeiting the payment) or the admin emergency brake can end
 *   it. A host emergency inside the window is a support conversation, not a button.
 */
export function hostMayCancelConfirmed(
	booking: typesHostCancelSlice,
	today: string,
	now = Date.now()
): boolean {
	const days = daysUntilCheckIn(booking.checkInDate, today);
	if (booking.paymentMethod === 'online') return days >= booking.policy.freeCancelDays;
	if (days <= 0) return false;
	return days >= booking.policy.freeCancelDays || stayConfirmationUnlocksCancel(booking, now);
}

/**
 * Is cancelling today inside the free window — i.e. a late cancellation?
 *
 * Only reachable for online bookings (cash can't cancel late at all); on an online booking
 * it means the capture is kept — non-refundable.
 */
export function isLateCancellation(
	checkInDate: string,
	today: string,
	policy: typesBookingPolicySnapshot
): boolean {
	return daysUntilCheckIn(checkInDate, today) < policy.freeCancelDays;
}
