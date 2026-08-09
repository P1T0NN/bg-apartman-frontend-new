// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { PaymentSettlementPatch } from '@/convex/payments/types/paymentsTypes';

/**
 * The one-word money outcome for the cancellation email's payment row
 * (BookingSystemDesign.md §8's "+ refund status"). Derived from what the settlement
 * actually did — never from what the policy intended. A failed refund/release returns
 * `undefined`: the email must not claim money moved when it didn't (the flag and a human
 * own that case).
 */
export function paymentNoteFrom(
	settlement: PaymentSettlementPatch,
	booking: Doc<'bookings'>
): 'refunded' | 'released' | 'kept' | undefined {
	if (settlement.paymentStatus === 'refunded') return 'refunded';
	if (settlement.paymentStatus === 'released') return 'released';
	// Late cancel: the capture stays with the host — say so plainly (§4's compensation row).
	if (settlement.paymentStatus === undefined && !settlement.paymentFlag) {
		if (booking.paymentStatus === 'paid') return 'kept';
	}
	return undefined;
}
