// LIBRARIES
import { v } from 'convex/values';
import { internalQuery } from '@/convex/_generated/server';
import { components } from '@/convex/_generated/api';

// CONFIG
import { MS_PER_DAY } from '@/shared/config';

// UTILS
import { analytics, hostAnalyticsScopeInput } from '@/convex/analytics';
import { monthStartUtc } from '@/shared/utils/dateUtils';

// TYPES
import type { QueryCtx } from '@/convex/_generated/server';

/**
 * DEV ONLY — what one host's analytics rollups currently hold: the exact reads the
 * `/host/analytics` chart makes. Non-zero buckets only. Use it to check that seeded (or
 * real) events landed where expected before blaming the chart.
 *
 * ```sh
 * bunx convex run dev/inspectAnalytics:inspectAnalytics '{"hostEmail":"you@example.com"}'
 * ```
 */

/** Better-auth account lookup by sign-in email — same as `seedMockBookings`. */
async function findHostId(ctx: QueryCtx, email: string) {
	const result = (await ctx.runQuery(components.betterAuth.userQueries.listUsersPaginated, {
		paginationOpts: { numItems: 5, cursor: null },
		search: email.trim().toLowerCase(),
		searchField: 'email' as const
	})) as { page: { _id: string; email: string }[] };
	return result.page[0]?._id;
}

export const inspectAnalytics = internalQuery({
	args: { hostEmail: v.string() },
	handler: async (ctx, args) => {
		const hostId = await findHostId(ctx, args.hostEmail);
		if (!hostId) throw new Error(`[inspectAnalytics] No account found for "${args.hostEmail}".`);

		const now = Date.now();
		const scope = hostAnalyticsScopeInput(hostId);

		const [monthly, daily] = await Promise.all([
			Promise.all(
				(['gmv', 'gmvCancelled', 'bookingsConfirmed', 'nightsBooked'] as const).map((metric) =>
					analytics.fetchTimeSeries(ctx, {
						metric,
						from: monthStartUtc(now, 11),
						to: now,
						bucketUnit: 'month',
						scope
					})
				)
			),
			analytics.fetchTimeSeries(ctx, {
				metric: 'bookingsConfirmed',
				from: now - 30 * MS_PER_DAY,
				to: now,
				bucketUnit: 'day',
				scope
			})
		]);

		const compact = (s: (typeof monthly)[number]) =>
			s.data
				.filter((p) => (p[s.meta.metric] ?? 0) !== 0)
				.map((p) => ({
					date: new Date(p.date).toISOString().slice(0, 10),
					value: p[s.meta.metric]
				}));

		return {
			hostId,
			monthly: Object.fromEntries(monthly.map((s) => [s.meta.metric, compact(s)])),
			dailyConfirmedLast30d: compact(daily)
		};
	}
});
