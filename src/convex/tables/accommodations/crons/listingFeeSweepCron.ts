// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '@/convex/functions';

// CONFIG
import { ACCOMMODATIONS_CONFIG, MS_PER_DAY, OPERATIONAL_LIMITS } from '@/shared/config';

// UTILS
import { internal } from '@/convex/_generated/api';
import { authComponent } from '@/convex/auth/auth';
import {
	sendListingFeeLapsedEmail,
	sendListingFeeReminderEmail
} from '@/convex/email/sendListingFeeEmails';
import {
	monetizationActive,
	listingFeeState
} from '@/shared/features/accommodation/utils/listingFeeState';

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
 *  1. **No-op unless `MONETIZATION === 'per_listing'`, and per row only for
 *     `monetization === 'listing_fee'` listings** — `booking_fee` rows are structurally out
 *     of reach (§8). It ships registered and inert; flipping the switch is what wakes it
 *     (§0.4 — behavior, never structure).
 *  2. **Rows with no `apartmentSubscriptionExpiryDate` are skipped entirely** (`unpaid` /
 *     `inactive` states). This is what makes §8's "switch honesty" true: turning
 *     monetization ON cannot unpublish anyone by itself. Stamp existing listings first with
 *     {@link backfillListingMonetization}.
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
		if (!monetizationActive()) return { reminded: 0, expired: 0, skipped: 'mode_not_active' };

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
			// `inactive` = not a listing-fee listing; `unpaid` = no period stamped (rule 2
			// above). Both left alone, forever if need be.
			if (state.kind === 'inactive' || state.kind === 'unpaid' || state.kind === 'active') continue;

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
 * The one-time backfill §8's "switch honesty" paragraph names (supersedes the old
 * `backfillListingFeePeriods`): stamp `monetization: 'listing_fee'` + a free first period
 * on every existing listing, so flipping `MONETIZATION` to `'per_listing'` unpublishes
 * nobody and creates require a choice legacy rows already have.
 *
 * All rows get the choice stamped, whatever their status (`booking_fee` was never
 * available before the revision, and it's gated behind the provider anyway); the free
 * period is granted to rows without one — harmless on non-published rows, since the sweep
 * only ever touches `published`.
 *
 * Run it BEFORE the flip, from the deploy notes:
 * ```bash
 * bunx convex run tables/accommodations/crons/listingFeeSweepCron:backfillListingMonetization
 * ```
 *
 * Idempotent + paginated (self-scheduling): re-running is free.
 */
export const backfillListingMonetization = internalMutation({
	args: {
		/** Override the free period. Defaults to the configured `PERIOD_DAYS`. */
		periodDays: v.optional(v.number()),
		cursor: v.optional(v.union(v.string(), v.null()))
	},
	returns: v.object({ stamped: v.number(), isDone: v.boolean() }),
	handler: async (ctx, args) => {
		const now = Date.now();
		const periodDays = args.periodDays ?? ACCOMMODATIONS_CONFIG.LISTING_FEE.PERIOD_DAYS;

		const page = await ctx.db.query('apartments').paginate({
			cursor: args.cursor ?? null,
			numItems: OPERATIONAL_LIMITS.LISTING_FEE_SWEEP_MAX_PER_RUN
		});

		let stamped = 0;
		for (const apartment of page.page) {
			const patch: {
				monetization?: 'listing_fee';
				apartmentSubscriptionExpiryDate?: number;
			} = {};

			if (apartment.monetization === undefined) patch.monetization = 'listing_fee';
			// No `paidAt` stamp: nobody paid for this. It is a grace period the platform is
			// granting, and the row should say so honestly.
			if (apartment.apartmentSubscriptionExpiryDate === undefined) {
				patch.apartmentSubscriptionExpiryDate = now + periodDays * MS_PER_DAY;
			}

			if (Object.keys(patch).length === 0) continue;
			await ctx.db.patch(apartment._id, { ...patch, updatedAt: now });
			stamped++;
		}

		if (!page.isDone) {
			await ctx.scheduler.runAfter(
				0,
				internal.tables.accommodations.crons.listingFeeSweepCron.backfillListingMonetization,
				{ periodDays: args.periodDays, cursor: page.continueCursor }
			);
		}

		return { stamped, isDone: page.isDone };
	}
});
