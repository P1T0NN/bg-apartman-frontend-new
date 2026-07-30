// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '@/convex/functions';

// CONFIG
import { ACCOMMODATIONS_CONFIG, MS_PER_DAY, OPERATIONAL_LIMITS } from '@/shared/config';

// UTILS
import { authComponent } from '@/convex/auth/auth';
import {
	sendListingFeeLapsedEmail,
	sendListingFeeReminderEmail
} from '@/convex/email/sendListingFeeEmails';
import { listingFeeModeActive, listingFeeState } from '@/shared/features/accommodation/utils/listingFeeState';

/**
 * The listing-fee lifecycle sweep (AccommodationsSystemDesign.md §8, §13.4) — the ONLY
 * machine transition in the listings state machine.
 *
 * Runs daily and does exactly two things to `published` listings whose paid period is
 * running out:
 *
 *   - **T−7 reminder** — one email per paid period. `feeReminderSentAt` is the guard; a
 *     payment clears it, so a daily re-read can't re-send (§10).
 *   - **Grace expiry** — past `apartmentSubscriptionExpiryDate + GRACE_DAYS`, flip
 *     `published` → `expired` with the machine-readable `expiredReason` stamp (invariant
 *     A2: no status change without evidence) and email the host with the renew link.
 *
 * Three rules that keep it honest:
 *
 *  1. **No-op unless `MONETIZATION === 'listing_fee'`.** It ships registered and inert;
 *     flipping the mode is what wakes it (§0.4 — behavior, never structure).
 *  2. **Rows with no `apartmentSubscriptionExpiryDate` are skipped entirely.** This is what
 *     makes §8's "mode-switch honesty" true: turning the mode ON cannot unpublish anyone by
 *     itself. Give existing listings a period first with {@link backfillListingFeePeriods}.
 *  3. **`expired` is cron-only and never a human's button** (§1, § FOR LLMs 3), and the
 *     flip touches status only — never content (A3).
 *
 * Expiry does NOT cancel anything: confirmed and checked-in stays live out normally, and
 * `expired` blocks only NEW bookings via A1 (§11's first row). Pending requests die at
 * confirm time — which is exactly the intended pressure on a host who wants to accept one.
 */
export const listingFeeSweep = internalMutation({
	args: {},
	returns: v.object({
		reminded: v.number(),
		expired: v.number(),
		skipped: v.optional(v.string())
	}),
	handler: async (ctx) => {
		if (!listingFeeModeActive()) return { reminded: 0, expired: 0, skipped: 'mode_not_active' };

		const now = Date.now();
		let reminded = 0;
		let expired = 0;

		// Only `published` rows can be reminded or expired: a suspended/archived listing has
		// no live period to defend, and re-publishing it is an admin decision, not a billing one.
		const published = await ctx.db
			.query('apartments')
			.withIndex('by_status', (q) => q.eq('status', 'published'))
			.take(OPERATIONAL_LIMITS.LISTING_FEE_SWEEP_MAX_PER_RUN);

		for (const apartment of published) {
			const state = listingFeeState(apartment, now);
			// `inactive` = no period stamped (rule 2 above). Left alone, forever if need be.
			if (state.kind === 'inactive' || state.kind === 'active') continue;

			const host = await authComponent.getAnyUserById(ctx, apartment.hostId);
			const hostEmail = host?.email?.trim();
			const hostName = host?.name?.trim() || 'Host';

			if (state.kind === 'lapsed') {
				await ctx.db.patch(apartment._id, {
					status: 'expired',
					expiredReason: 'listing_fee_lapsed',
					updatedAt: now
				});
				expired++;

				if (hostEmail) {
					await sendListingFeeLapsedEmail(ctx, {
						// No per-host locale is stored; cron emails default to English.
						locale: 'en',
						hostName,
						hostEmail,
						apartmentTitle: apartment.title
					});
				}
				continue;
			}

			// `expiring` (inside the reminder window) or `grace` (overdue but still live) —
			// both deserve the nudge, and both send it at most once per paid period.
			if (apartment.feeReminderSentAt !== undefined) continue;

			await ctx.db.patch(apartment._id, { feeReminderSentAt: now });
			reminded++;

			if (hostEmail) {
				await sendListingFeeReminderEmail(ctx, {
					locale: 'en',
					hostName,
					hostEmail,
					apartmentTitle: apartment.title,
					expiresAt: state.expiresAt,
					daysLeft: Math.max(state.daysLeft, 0)
				});
			}
		}

		return { reminded, expired };
	}
});

/**
 * The one-time backfill §8's "mode-switch honesty" paragraph names: give every currently
 * published listing that has no period a free one, so flipping `MONETIZATION` to
 * `listing_fee` unpublishes nobody.
 *
 * Run it BEFORE the flip, from the deploy notes:
 * ```bash
 * bunx convex run tables/accommodations/crons/listingFeeSweepCron:backfillListingFeePeriods
 * ```
 *
 * Idempotent: rows that already have an expiry are untouched, so re-running is free.
 */
export const backfillListingFeePeriods = internalMutation({
	args: {
		/** Override the free period. Defaults to the configured `PERIOD_DAYS`. */
		periodDays: v.optional(v.number())
	},
	returns: v.object({ stamped: v.number() }),
	handler: async (ctx, args) => {
		const now = Date.now();
		const periodDays = args.periodDays ?? ACCOMMODATIONS_CONFIG.LISTING_FEE.PERIOD_DAYS;

		const published = await ctx.db
			.query('apartments')
			.withIndex('by_status', (q) => q.eq('status', 'published'))
			.take(OPERATIONAL_LIMITS.LISTING_FEE_SWEEP_MAX_PER_RUN);

		let stamped = 0;
		for (const apartment of published) {
			if (apartment.apartmentSubscriptionExpiryDate !== undefined) continue;

			// No `paidAt` stamp: nobody paid for this. It is a grace period the platform is
			// granting, and the row should say so honestly.
			await ctx.db.patch(apartment._id, {
				apartmentSubscriptionExpiryDate: now + periodDays * MS_PER_DAY,
				updatedAt: now
			});
			stamped++;
		}

		return { stamped };
	}
});
