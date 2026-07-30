// CONFIG
import { STAY_CONFIRMATION_UNLOCK_MS } from '@/shared/config';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/** The slice stay-confirmation logic reads — satisfied by `Doc<'bookings'>` and the safe types. */
export type typesStayConfirmationSlice = Pick<
	Doc<'bookings'>,
	'stayConfirmationRequestedAt' | 'stayConfirmedAt'
>;

/**
 * Has the guest answered the (latest) confirmation request?
 *
 * A confirm BEFORE the latest request doesn't count — re-requesting deliberately resets
 * the question ("plans can change"), which is also why requests overwrite rather than
 * accumulate (BookingSystemDesign.md §11).
 */
export function stayConfirmationAnswered(b: typesStayConfirmationSlice): boolean {
	return (
		b.stayConfirmedAt !== undefined &&
		(b.stayConfirmationRequestedAt === undefined ||
			b.stayConfirmedAt >= b.stayConfirmationRequestedAt)
	);
}

/** A request exists and the guest hasn't answered it (yet). Drives the guest banner. */
export function stayConfirmationPending(b: typesStayConfirmationSlice): boolean {
	return b.stayConfirmationRequestedAt !== undefined && !stayConfirmationAnswered(b);
}

/**
 * "Unresponsive", provably: a request has sat unanswered for the unlock window. This is
 * what opens the host's cash-inside-window cancel — abuse is structurally impossible
 * because the claim requires a timestamped, ignored request.
 */
export function stayConfirmationUnlocksCancel(
	b: typesStayConfirmationSlice,
	now = Date.now()
): boolean {
	return (
		stayConfirmationPending(b) &&
		now - (b.stayConfirmationRequestedAt as number) >= STAY_CONFIRMATION_UNLOCK_MS
	);
}
