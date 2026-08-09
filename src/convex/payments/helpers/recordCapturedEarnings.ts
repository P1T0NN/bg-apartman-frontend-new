// UTILS
import { authComponent } from '@/convex/auth/auth';
import { counters } from '@/convex/functions';
import { analytics, ANALYTICS_EVENT } from '@/convex/analytics';
import { sendHostEarningsHeldEmail } from '@/convex/email/sendHostEarningsHeldEmail';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { MutationCtx } from '@/convex/_generated/server';

/**
 * The ledger write that follows every capture (PaymentsSystemDesign.md §5): one row per
 * captured booking, amounts frozen from the booking's price snapshot — never recomputed
 * from live listing prices or live fee config (§ FOR LLMs 7).
 *
 * Idempotent by construction (`by_booking` lookup first) so a duplicate capture webhook
 * cannot double-credit a host — §6's rule that handlers are "is the target state already
 * written? → no-op or write".
 *
 * Also carries stage 3 of onboarding (§2): the ONE ask, at the dopamine peak. The email
 * goes out on each capture *only while the host is not yet payable* — the growing number
 * is the drip campaign, and a host who has finished onboarding is never asked again
 * (stage 4: "nothing, ever again"). Nothing here blocks or gates the booking.
 */
export async function recordCapturedEarnings(
	ctx: MutationCtx,
	booking: Doc<'bookings'>
): Promise<void> {
	const existing = await ctx.db
		.query('bookingEarnings')
		.withIndex('by_booking', (q) => q.eq('bookingId', booking._id))
		.first();
	if (existing) return;

	const net = booking.total - booking.platformFee;

	await ctx.db.insert('bookingEarnings', {
		bookingId: booking._id,
		hostId: booking.hostId,
		gross: booking.total,
		platformFee: booking.platformFee,
		net,
		status: 'held'
	});

	// Platform revenue, stream 2 of 2 (ASD §8 "platform-revenue events"): the snapshot's
	// fee became the platform's money at capture. Idempotent with the ledger row above —
	// a duplicate capture webhook returns before reaching here.
	if (booking.platformFee > 0) {
		await analytics.track(ctx, ANALYTICS_EVENT.INVOICE_PAID, {
			properties: {
				amountCents: booking.platformFee * 100,
				currency: booking.currency,
				plan: 'booking_fee'
			}
		});
	}

	const account = await ctx.db
		.query('hostPayoutAccounts')
		.withIndex('by_host', (q) => q.eq('hostId', booking.hostId))
		.first();

	// Stage 4 hosts are done being asked. Stage 2/3 hosts get the balance email.
	if (account?.transfersActive) return;

	const host = await authComponent.getAnyUserById(ctx, booking.hostId);
	const hostEmail = host?.email?.trim();
	if (!hostEmail) return;

	// Held balance = sum of `net` over this host's `held` rows — a NOW-question, so the
	// counter answers it (GeneralSystemDesignRule.md § table counts). The row above is
	// already in the tree: writes go through the trigger-wrapped constructors.
	const heldEuros = await counters.hostEarnings.aggregate.sum(ctx, {
		namespace: booking.hostId,
		bounds: {
			lower: { key: 'held', inclusive: true },
			upper: { key: 'held', inclusive: true }
		}
	});

	await sendHostEarningsHeldEmail(ctx, {
		// No per-host locale is stored; host emails default to English.
		locale: 'en',
		hostName: host?.name?.trim() || 'Host',
		hostEmail,
		earnedEuros: net,
		heldEuros
	});
}
