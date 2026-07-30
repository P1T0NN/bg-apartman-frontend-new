// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

type PaymentFlag = NonNullable<Doc<'bookings'>['paymentFlag']>;

/**
 * What each payment flag means to the admin who has to finish the job
 * (PaymentsSystemDesign.md §4/§6).
 *
 * The design's failure pattern is "state unchanged + admin flag + reconciliation
 * re-surface" — so every entry says the same two things: what the platform could NOT do,
 * and what the human should do in the provider dashboard before marking it handled.
 * Keyed by the schema union, so a new flag cannot ship without copy.
 */
export const PAYMENT_FLAG_COPY: Record<PaymentFlag, { title: string; body: string }> = {
	capture_failed: {
		title: "The guest's payment could not be taken",
		body: 'The card hold is still in place and the booking is waiting on the host as a normal request. Check the payment in the provider dashboard; if it went through after all, mark this handled.'
	},
	refund_failed: {
		title: 'The refund did not go through',
		body: 'The booking is cancelled but the guest still has their money taken. Issue the refund in the provider dashboard, then mark this handled.'
	},
	release_failed: {
		title: 'The card hold could not be released',
		body: 'No money moved, but the hold may still show on the guest’s card. Release it in the provider dashboard, then mark this handled.'
	},
	transfer_failed: {
		title: "The host's payout failed",
		body: 'The earnings stay held and the payout sweep skips this row until the flag is cleared — usually a closed or rejected bank account. Sort it with the host, then mark this handled to let the next sweep retry.'
	},
	reconcile_mismatch: {
		title: 'This payment has been stuck too long',
		body: 'The daily reconciliation found a payment sitting in a non-final state past its window, or could not reach the provider to confirm it. Compare against the provider dashboard and finish whatever is outstanding.'
	}
};
