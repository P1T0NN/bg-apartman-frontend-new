// LIBRARIES
import { query, internalQuery } from '@/convex/_generated/server';

// CONFIG
import { components } from '@/convex/_generated/api';

// UTILS
import { requireAdmin } from '@/convex/auth/middleware/authMiddleware';
import { analytics } from '@/convex/analytics';
import { counters } from '@/convex/functions';
import { todayInPropertyZone } from '@/shared/features/booking/utils/daysUntilCheckIn';
import { monthStartUtc } from '@/shared/utils/dateUtils';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { QueryCtx } from '@/convex/_generated/server';
import type { AdminDashboardPage } from '@/convex/pages/admin/dashboard/types/adminDashboardTypes';

// Band 3's revenue is PLATFORM revenue — what WE earn (listing fees + collected booking
// fees, `invoice.paid`), net of fee refunds — never hosts' booking money (GMV). Corrected
// 2026-07-31 per AdminDashboardPageSystemDesign.md §1/§3 and ASD §8 "platform-revenue
// events". Honest zeros while `MONETIZATION: 'none'` — nothing tracks `invoice.paid` yet.

/** How many reports Band 1 shows; `/admin/reports` is the full inbox. */
const REPORTS_QUEUE_LIMIT = 5;

/**
 * Everything `/admin/dashboard` renders — one aggregated read, mirror of the host
 * dashboard's single-payload pattern (AdminDashboardPageSystemDesign.md §3/§4).
 *
 * Realtime verdict: **subscription** — reports, bookings and signups arrive from other
 * people while the admin watches (GeneralSystemDesignRule.md's admin-orders example).
 * The read is cheap by construction, so re-runs on writes are affordable:
 *   - NOW-questions (queue count, check-ins, pending, published) are counter reads,
 *     O(log n), never a scan;
 *   - HAPPENED-questions (signups, bookings created, the 12-month series) are the
 *     analytics component's pre-aggregated rollups, global scope — every tracked event
 *     rolls up globally regardless of its host resource scope;
 *   - the only table reads are two `.take(5)` slices of the reports queue and the
 *     component-side user count, which is itself `.take()`-bounded.
 *
 * That last one is why "cheap by construction" has to be enforced, not assumed: this
 * subscription's read set spans the platform, so it re-runs on every rollup write anywhere,
 * not once per page view. Anything unbounded added here is multiplied by the platform's
 * whole event rate. Keep every read in this handler either a counter, a rollup, or
 * explicitly capped.
 */
export const fetchAdminDashboardPageSafe = query({
	args: {},
	handler: async (ctx): Promise<AdminDashboardPage> => {
		await requireAdmin(ctx);
		return await readAdminDashboardPage(ctx);
	}
});

/** DEV ONLY — the same read without the auth gate, for `bunx convex run` smoke checks. */
export const inspectAdminDashboardPage = internalQuery({
	args: {},
	handler: async (ctx): Promise<AdminDashboardPage> => await readAdminDashboardPage(ctx)
});

async function readAdminDashboardPage(ctx: QueryCtx): Promise<AdminDashboardPage> {
	{
		const now = Date.now();
		const todayIso = todayInPropertyZone();
		const dayStartMs = Date.parse(todayIso);
		const seriesFrom = monthStartUtc(now, 11);

		// checkInDate is the counter's sort key, so "today's check-ins" is an exact-key bound.
		const todayBounds = {
			lower: { key: todayIso, inclusive: true },
			upper: { key: todayIso, inclusive: true }
		} as const;

		const [
			stampedNew,
			legacyNew,
			newReportsTotal,
			signups,
			bookingsCreated,
			checkIns,
			pendingOpen,
			usersTotal,
			publishedListings,
			metricMaps
		] = await Promise.all([
			// Queue rows: the `'new'` read is two index slices merged — an index match is exact,
			// and rows filed before `status` existed stored nothing (AdminPagesSystemDesign.md §4).
			ctx.db
				.query('reports')
				.withIndex('by_status', (q) => q.eq('status', 'new'))
				.order('desc')
				.take(REPORTS_QUEUE_LIMIT),
			ctx.db
				.query('reports')
				.withIndex('by_status', (q) => q.eq('status', undefined))
				.order('desc')
				.take(REPORTS_QUEUE_LIMIT),
			// The aggregate's namespace already normalizes `undefined → 'new'`.
			counters.reports.count(ctx, 'new'),
			analytics
				.fetchSummary(ctx, { metric: 'newUsers', from: dayStartMs, to: now })
				.then((s) => s.value),
			// booking.created — measures demand: stays 5 today even if 2 cancel later.
			analytics
				.fetchSummary(ctx, { metric: 'bookings', from: dayStartMs, to: now })
				.then((s) => s.value),
			counters.bookings.aggregate.count(ctx, { namespace: 'confirmed', bounds: todayBounds }),
			counters.bookings.count(ctx, 'pending'),
			// BA `user` table is component-local — the app's counter triggers can't see it,
			// so the count lives beside the data (see `countUsers` for its stated ceiling).
			ctx.runQuery(components.betterAuth.userQueries.countUsers, {}),
			counters.apartments.count(ctx, 'published'),
			// One Map per metric: UTC month start → value. Global scope (no `scope` arg).
			// `refunds` is grouped by `plan` so ONLY the fee-portion reversals (tagged
			// `booking_fee`, ASD §8) subtract from platform revenue — the untagged
			// full-total refund events are guest money, not ours.
			Promise.all([
				analytics.fetchTimeSeries(ctx, {
					metric: 'revenue',
					from: seriesFrom,
					to: now,
					bucketUnit: 'month'
				}),
				analytics.fetchTimeSeries(ctx, {
					metric: 'refunds',
					groupBy: 'plan',
					from: seriesFrom,
					to: now,
					bucketUnit: 'month'
				}),
				analytics.fetchTimeSeries(ctx, {
					metric: 'bookingsConfirmed',
					from: seriesFrom,
					to: now,
					bucketUnit: 'month'
				})
			]).then(([revenue, refundsByPlan, confirmed]) => ({
				revenueCentsByMonth: new Map(
					revenue.data.map((p) => [p.date, p[revenue.meta.metric] ?? 0])
				),
				feeRefundCentsByMonth: new Map(
					refundsByPlan.data.map((p) => [p.date, p['booking_fee'] ?? 0])
				),
				confirmedByMonth: new Map(
					confirmed.data.map((p) => [p.date, p[confirmed.meta.metric] ?? 0])
				)
			}))
		]);

		const items = [...stampedNew, ...legacyNew]
			.sort((a, b) => b._creationTime - a._creationTime)
			.slice(0, REPORTS_QUEUE_LIMIT)
			.map((r: Doc<'reports'>) => ({
				_id: r._id,
				category: r.category,
				message: r.message,
				email: r.email ?? null,
				_creationTime: r._creationTime
			}));

		const { revenueCentsByMonth, feeRefundCentsByMonth, confirmedByMonth } = metricMaps;

		// Zero-filled 12 slots, oldest first — rollups only return non-empty buckets, and a
		// chart with missing months lies. Revenue = platform revenue in whole EUR
		// (`invoice.paid` − fee refunds, both tracked in cents); bookings = gross
		// confirmations, same as /host/analytics.
		const series = Array.from({ length: 12 }, (_, i) => {
			const date = monthStartUtc(now, 11 - i);
			return {
				date,
				bookings: confirmedByMonth.get(date) ?? 0,
				revenue: Math.round(
					((revenueCentsByMonth.get(date) ?? 0) - (feeRefundCentsByMonth.get(date) ?? 0)) / 100
				)
			};
		});
		const currentMonth = series[series.length - 1];

		return {
			reportsQueue: { items, total: newReportsTotal },
			today: { signups, bookingsCreated, checkIns, pendingOpen },
			platform: {
				usersTotal: usersTotal.total,
				usersTotalCapped: usersTotal.capped,
				publishedListings,
				bookingsThisMonth: currentMonth.bookings,
				revenueThisMonth: currentMonth.revenue,
				series
			}
		};
	}
}
