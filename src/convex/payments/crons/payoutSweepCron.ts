// LIBRARIES
import { v } from 'convex/values';
import { internalAction, internalQuery } from '@/convex/_generated/server';
import { internalMutation } from '@/convex/functions';

// CONFIG
import { OPERATIONAL_LIMITS, PAYMENTS_CONFIG } from '@/shared/config';

// UTILS
import { internal } from '@/convex/_generated/api';
import { paymentsAdapter, onlinePaymentsEnabled } from '@/convex/payments/adapter';

// TYPES
import type { Id } from '@/convex/_generated/dataModel';

/**
 * A `held` earning row is transferable when ALL THREE hold (PaymentsSystemDesign.md §5):
 *
 *  1. the booking is **terminal with money owed** — `checked_out`, or `cancelled` with
 *     `lateCancellation` (the host keeps late-cancel money);
 *  2. the host is **payable** — the provider confirmed transfers active, tracked on
 *     `hostPayoutAccounts` by webhook ONLY;
 *  3. this sweep picks it up.
 *
 * Never transfer on a non-terminal booking (§ FOR LLMs 4). Between check-in and check-out
 * the admin emergency brake can still refund; paying the host earlier would create the
 * clawback state §0.4 excludes structurally. `PAYOUT_TRIGGER` documents the cost — moving
 * it to check-in needs a clawback design this system deliberately lacks.
 */
export const findTransferableEarnings = internalQuery({
	args: {},
	handler: async (ctx) => {
		// Indexed, not `.filter()`ed: a filter runs AFTER the fetch, so it would scan every
		// host who ever started onboarding to find the payable minority — and most sit at
		// `transfersActive: false` (stage 2), so almost all of that read is waste.
		const payableHosts = await ctx.db
			.query('hostPayoutAccounts')
			.withIndex('by_transfers_active', (q) => q.eq('transfersActive', true))
			.take(OPERATIONAL_LIMITS.BOOKING_LIFECYCLE_MAX_PER_RUN);

		const eligible: {
			earningId: Id<'bookingEarnings'>;
			net: number;
			providerAccountId: string;
			bookingId: Id<'bookings'>;
		}[] = [];

		for (const account of payableHosts) {
			const held = await ctx.db
				.query('bookingEarnings')
				.withIndex('by_host_status', (q) => q.eq('hostId', account.hostId).eq('status', 'held'))
				.take(OPERATIONAL_LIMITS.BOOKING_LIFECYCLE_MAX_PER_RUN);

			for (const earning of held) {
				// Flagged rows are a human's job; the sweep resumes only after the flag clears.
				if (earning.payoutFlag) continue;

				const booking = await ctx.db.get(earning.bookingId);
				if (!booking) continue;

				const terminalWithMoneyOwed =
					booking.status === 'checked_out' ||
					(booking.status === 'cancelled' && booking.lateCancellation === true);
				if (!terminalWithMoneyOwed) continue;

				eligible.push({
					earningId: earning._id,
					net: earning.net,
					providerAccountId: account.providerAccountId,
					bookingId: earning.bookingId
				});
			}
		}

		return eligible;
	}
});

/** Stamp one transfer's outcome. Success writes refs; failure flags and leaves it `held`. */
export const recordTransferOutcome = internalMutation({
	args: {
		earningId: v.id('bookingEarnings'),
		transferRef: v.optional(v.string())
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const earning = await ctx.db.get(args.earningId);
		if (!earning || earning.status !== 'held') return null;

		if (args.transferRef === undefined) {
			await ctx.db.patch(args.earningId, { payoutFlag: 'transfer_failed' });
			return null;
		}

		await ctx.db.patch(args.earningId, {
			status: 'transferred',
			transferRef: args.transferRef,
			transferredAt: Date.now(),
			payoutFlag: undefined
		});

		return null;
	}
});

/**
 * Daily payout sweep (PaymentsSystemDesign.md §5). An action because `transfer()` is
 * network I/O; the eligibility read and the stamp are its query/mutation bookends.
 *
 * Fees are transfer-math — we send the host `net`, the platform keeps the difference.
 * There is no provider fee parameter anywhere in this path (§1 flow C, § FOR LLMs 5).
 */
export const sweepHostPayouts = internalAction({
	args: {},
	handler: async (ctx) => {
		if (!onlinePaymentsEnabled()) return { transferred: 0, failed: 0, skipped: 'no_provider' };

		const eligible = await ctx.runQuery(
			internal.payments.crons.payoutSweepCron.findTransferableEarnings,
			{}
		);

		let transferred = 0;
		let failed = 0;

		for (const row of eligible) {
			let transferRef: string | undefined;
			try {
				transferRef = await paymentsAdapter.transfer(row.net, row.providerAccountId, {
					bookingId: row.bookingId,
					trigger: PAYMENTS_CONFIG.PAYOUT_TRIGGER
				});
			} catch (error) {
				console.error('[sweepHostPayouts] transfer failed', row.earningId, error);
			}

			await ctx.runMutation(internal.payments.crons.payoutSweepCron.recordTransferOutcome, {
				earningId: row.earningId,
				transferRef
			});

			if (transferRef === undefined) failed++;
			else transferred++;
		}

		return { transferred, failed };
	}
});
