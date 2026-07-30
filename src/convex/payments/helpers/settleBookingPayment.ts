// UTILS
import { paymentsAdapter } from '@/convex/payments/adapter';
import { analytics, ANALYTICS_EVENT } from '@/convex/analytics';
import { paymentSettlementAction } from '@/shared/features/booking/utils/paymentSettlementAction';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { MutationCtx } from '@/convex/_generated/server';

/** The payment columns a settlement writes — merged into the booking's transition patch. */
export type PaymentSettlementPatch = {
	paymentStatus?: Doc<'bookings'>['paymentStatus'];
	paymentFlag?: Doc<'bookings'>['paymentFlag'];
};

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

/**
 * The money consequence of a booking ending — PaymentsSystemDesign.md §4's matrix, entire.
 *
 * **The matrix is closed** (§ FOR LLMs 4): a refund path not in the table does not exist.
 * Add a row to the design before adding a branch here.
 *
 * | booking-side event                         | action    | result                     |
 * | ------------------------------------------ | --------- | -------------------------- |
 * | withdraw / decline / expire of `authorized` | `release` | `released`                 |
 * | guest cancels ON TIME (`paid`)             | `refund`  | `refunded`                 |
 * | guest cancels LATE (`paid`)                | nothing   | stays `paid` (host keeps)  |
 * | host cancels (`paid`/`authorized`)         | refund/release | `refunded`/`released` |
 * | admin cancels (`paid`/`authorized`)        | refund/release | `refunded`/`released` |
 * | the API call fails                         | nothing   | unchanged + admin flag     |
 *
 * Cash (`on_arrival`) and invisible checkouts (`awaiting`) never enter this document —
 * they return an empty patch. All refunds are FULL: the policy has no partial tiers, so
 * neither does the money. Refunds always come out of platform-held funds, because §5's
 * terminal-only transfer rule guarantees the money has not left for the host yet in every
 * refundable state — which is why this table has no "reverse the transfer" row.
 *
 * `keepMoney` is the late-cancellation case only: the host's compensation stays `paid`,
 * the earnings row stays owed, and it transfers on the normal sweep (§4, §5).
 */
export async function settleBookingPayment(
	ctx: MutationCtx,
	booking: Doc<'bookings'>,
	{ keepMoney = false }: { keepMoney?: boolean } = {}
): Promise<PaymentSettlementPatch> {
	// The decision lives in one pure, checked function; this function only enacts it.
	const action = paymentSettlementAction(booking.paymentStatus, keepMoney);
	if (action === 'none' || !booking.paymentRef) return {};

	if (action === 'release') {
		try {
			await paymentsAdapter.release(booking.paymentRef);
			return { paymentStatus: 'released' };
		} catch {
			// State unchanged + a human is told. No retry loop, no saga (§0, § FOR LLMs 6).
			return { paymentFlag: 'release_failed' };
		}
	}

	try {
		await paymentsAdapter.refund(booking.paymentRef);
	} catch {
		return { paymentFlag: 'refund_failed' };
	}

	// Earnings truth follows money truth in the same mutation (§5).
	const earning = await ctx.db
		.query('bookingEarnings')
		.withIndex('by_booking', (q) => q.eq('bookingId', booking._id))
		.first();
	if (earning && earning.status === 'held') {
		await ctx.db.patch(earning._id, { status: 'returned' });
	}

	await analytics.track(ctx, ANALYTICS_EVENT.REFUND_CREATED, {
		// Whole euros in the snapshot; the metric is denominated in cents.
		properties: { amountCents: booking.total * 100, currency: booking.currency }
	});

	return { paymentStatus: 'refunded' };
}
