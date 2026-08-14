// I18N
import { m } from '@/lib/paraglide/messages';

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
		title: m['paymentFlags.captureFailedTitle'](),
		body: m['paymentFlags.captureFailedBody']()
	},
	refund_failed: {
		title: m['paymentFlags.refundFailedTitle'](),
		body: m['paymentFlags.refundFailedBody']()
	},
	release_failed: {
		title: m['paymentFlags.releaseFailedTitle'](),
		body: m['paymentFlags.releaseFailedBody']()
	},
	transfer_failed: {
		title: m['paymentFlags.transferFailedTitle'](),
		body: m['paymentFlags.transferFailedBody']()
	},
	reconcile_mismatch: {
		title: m['paymentFlags.reconcileMismatchTitle'](),
		body: m['paymentFlags.reconcileMismatchBody']()
	}
};
