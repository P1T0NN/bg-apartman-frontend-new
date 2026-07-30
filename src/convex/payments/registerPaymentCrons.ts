// LIBRARIES
import type { Crons } from 'convex/server';

// TYPES
import type { internal } from '../_generated/api';

type InternalApi = typeof internal;

/**
 * The two money crons (PaymentsSystemDesign.md §5, §6). Both no-op immediately while
 * `PAYMENTS_CONFIG.PROVIDER` is `'none'`, so they cost one function invocation a day until
 * the launch flips the constant.
 */
export function registerPaymentCrons(crons: Crons, internalApi: InternalApi) {
	/**
	 * Move `held` earnings to hosts once the booking is terminal-with-money-owed AND the
	 * host is payable. Daily: hosts are paid after a stay ends, not by the minute, and a
	 * missed run just means the next one takes two days' worth.
	 */
	crons.daily(
		'sweep host payouts',
		{ hourUTC: 3, minuteUTC: 0 },
		internalApi.payments.crons.payoutSweepCron.sweepHostPayouts,
		{}
	);

	/**
	 * Compare non-settled money states against provider truth and flag mismatches for a
	 * human. This is the whole failure-recovery system — no retry queues (§6).
	 */
	crons.daily(
		'reconcile payments',
		{ hourUTC: 4, minuteUTC: 0 },
		internalApi.payments.crons.reconciliationCron.reconcilePayments,
		{}
	);
}
