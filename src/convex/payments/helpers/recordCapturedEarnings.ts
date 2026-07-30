// UTILS
import { authComponent } from '@/convex/auth/auth';
import { aggregateHostEarnings } from '@/convex/aggregates';
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
	// aggregate answers it (GeneralSystemDesignRule.md § table counts). The row above is
	// already in the tree: writes go through the trigger-wrapped constructors.
	const heldEuros = await aggregateHostEarnings.sum(ctx, {
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
