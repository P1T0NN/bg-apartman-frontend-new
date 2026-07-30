// LIBRARIES
import { v } from 'convex/values';
import { internalAction, internalQuery } from '@/convex/_generated/server';
import { internalMutation } from '@/convex/functions';

// CONFIG
import { HOST_RESPONSE_MS, MS_PER_DAY, OPERATIONAL_LIMITS } from '@/shared/config';

// UTILS
import { internal } from '@/convex/_generated/api';
import { paymentsAdapter, onlinePaymentsEnabled } from '@/convex/payments/adapter';

// TYPES
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Reconciliation, NOT sagas (PaymentsSystemDesign.md §6).
 *
 * A daily sweep of non-settled money states compared against provider truth; mismatches
 * become an admin flag. This is the ENTIRE failure-recovery system — volumes are
 * human-scale and every flow already fails toward a flagged row a human can finish (§4,
 * §5). Do not add retry queues, backoff loops or saga states (§ FOR LLMs 6).
 *
 * The states it looks at:
 *  - `awaiting` past its deadline + grace (the reaper should have taken it),
 *  - `authorized` older than the host response window (the expiry cron should have
 *    released it),
 *  - anything already flagged — re-surfaced so a forgotten one doesn't rot.
 */

/** Grace on top of the checkout deadline before an `awaiting` row counts as stuck. */
const AWAITING_GRACE_MS = MS_PER_DAY;

export const findUnsettledPayments = internalQuery({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();

		const pending = await ctx.db
			.query('bookings')
			.withIndex('by_status', (q) => q.eq('status', 'pending'))
			.take(OPERATIONAL_LIMITS.BOOKING_LIFECYCLE_MAX_PER_RUN);

		const stuck: { bookingId: Id<'bookings'>; paymentRef?: string }[] = [];

		for (const booking of pending) {
			if (booking.paymentFlag) continue; // already a human's job

			if (
				booking.paymentStatus === 'awaiting' &&
				booking.paymentDeadlineAt !== undefined &&
				booking.paymentDeadlineAt + AWAITING_GRACE_MS <= now
			) {
				stuck.push({ bookingId: booking._id, paymentRef: booking.paymentRef });
				continue;
			}

			if (
				booking.paymentStatus === 'authorized' &&
				booking.pendingExpiresAt !== undefined &&
				booking.pendingExpiresAt + HOST_RESPONSE_MS <= now
			) {
				stuck.push({ bookingId: booking._id, paymentRef: booking.paymentRef });
			}
		}

		return stuck;
	}
});

export const flagBookingPayment = internalMutation({
	args: { bookingId: v.id('bookings') },
	returns: v.null(),
	handler: async (ctx, args) => {
		const booking = await ctx.db.get(args.bookingId);
		// `paymentStatus` is deliberately left at its last true value — the flag says only
		// that reality and our record may have diverged (§4's failure row).
		if (!booking || booking.paymentFlag) return null;

		await ctx.db.patch(args.bookingId, { paymentFlag: 'reconcile_mismatch' });
		return null;
	}
});

/**
 * Daily reconciliation pass. An action because the provider comparison is network I/O; the
 * candidate read and the flag write are its query/mutation bookends.
 */
export const reconcilePayments = internalAction({
	args: {},
	handler: async (ctx) => {
		if (!onlinePaymentsEnabled()) return { flagged: 0, skipped: 'no_provider' };

		const stuck = await ctx.runQuery(
			internal.payments.crons.reconciliationCron.findUnsettledPayments,
			{}
		);

		let flagged = 0;
		for (const row of stuck) {
			// With a ref, ask the provider what it thinks. `released`/`refunded` there means
			// the money side already resolved and only our row lagged — nothing for a human
			// to do beyond the next cron pass, so don't cry wolf.
			if (row.paymentRef) {
				try {
					const state = await paymentsAdapter.fetchPaymentState(row.paymentRef);
					if (state === 'released' || state === 'refunded') continue;
				} catch {
					// Can't reach the provider — flag it; a human beats a guess.
				}
			}

			await ctx.runMutation(internal.payments.crons.reconciliationCron.flagBookingPayment, {
				bookingId: row.bookingId
			});
			flagged++;
		}

		return { flagged };
	}
});
