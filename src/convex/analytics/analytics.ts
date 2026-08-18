// LIBRARIES
import { AnalyticsClient } from '@vllnt/convex-analytics';

// CONFIG
import { MS_PER_DAY } from '@/shared/config';
import { components } from '@/convex/_generated/api';
import { internalMutation } from '@/convex/_generated/server';

// HELPERS
import {
	PLATFORM_PLANS,
	PLATFORM_REVENUE_NAMESPACE,
	dayStartUtc,
	platformFeeRefunds,
	platformRevenue,
	readSumSeries,
	sumAggregates
} from './sumRollups';
import type { SumAggregate } from './sumRollups';

// TYPES
import type { MutationCtx, QueryCtx } from '@/convex/_generated/server';

/**
 * Analytics, backed by the `@vllnt/convex-analytics` component.
 *
 * vllnt does COUNT rollups only (`metric` / `top` / `timeseries`), so this app's money +
 * occupancy SUMS live on `@convex-dev/aggregate` instead — see `./sumRollups.ts`. The one
 * vllnt-tracked event is `booking.confirmed` (the `bookingsConfirmed` count metric, read
 * from both host and admin dashboards); every other old `@piton-` event — payments,
 * subscriptions, file/storage, signups — had no reader and was dropped.
 *
 * Multi-tenancy: every event lives in the single default scope, partitioned by a `hostId`
 * DIMENSION (`dimensions: ['hostId']`). A host read filters `where: { dim: 'hostId', val:
 * hostId }`; a global admin read omits the filter. There is no `hostAnalyticsScope`
 * resource-scope concept anymore — a host id is just a dimension value.
 */
export const ANALYTICS_EVENT = {
	BOOKING_CONFIRMED: 'booking.confirmed'
} as const;

const client = new AnalyticsClient(components.analytics, {
	dimensions: ['hostId'],
	granularities: ['day']
});

type SeriesPoint = { date: number } & Record<string, number>;
type TimeSeries = { data: SeriesPoint[]; meta: { metric: string } };

type FetchTimeSeriesOpts = {
	metric: string;
	from: number;
	to: number;
	bucketUnit: 'day' | 'month';
	/** Host-scoped reads pass the host id; admin (global) reads omit it. */
	hostId?: string;
};

const SUM_METRICS = sumAggregates as Record<string, SumAggregate>;

/** UTC start-of-month for grouping vllnt's day buckets into month buckets on read. */
function monthStartOf(ms: number): number {
	const d = new Date(ms);
	return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
}

/** `[start, end)` ranges (upper exclusive) covering `[from, to]`, one per bucket. */
function bucketRanges(from: number, to: number, unit: 'day' | 'month'): Array<{ start: number; end: number }> {
	if (unit === 'day') {
		const out: Array<{ start: number; end: number }> = [];
		for (let s = dayStartUtc(from); s <= to; s += MS_PER_DAY) out.push({ start: s, end: s + MS_PER_DAY });
		return out;
	}
	const out: Array<{ start: number; end: number }> = [];
	const d = new Date(from);
	let s = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
	while (s <= to) {
		const next = new Date(s);
		next.setUTCMonth(next.getUTCMonth() + 1);
		out.push({ start: s, end: next.getTime() });
		s = next.getTime();
	}
	return out;
}

/**
 * Pre-aggregated series read, one `{date, [metric]}[]` per metric. Matches the old
 * `analytics.fetchTimeSeries` contract: `meta.metric` names the key each point carries.
 *
 * - `bookingsConfirmed` → vllnt day rollups (grouped to month on read when the bucket is a
 *   month — vllnt has no month granularity).
 * - `gmv` / `gmvCancelled` / `nightsBooked` / `nightsReleased` → aggregate sum rollups.
 * - `revenue` / `refunds` → aggregate sum rollups, global scope (StripeTODO §7).
 */
async function fetchTimeSeries(ctx: QueryCtx, opts: FetchTimeSeriesOpts): Promise<TimeSeries> {
	const { metric, from, to, bucketUnit, hostId } = opts;

	if (metric === 'bookingsConfirmed') {
		const points = await client.timeseries(ctx, ANALYTICS_EVENT.BOOKING_CONFIRMED, {
			granularity: 'day',
			range: { from, to },
			...(hostId ? { where: { dim: 'hostId', val: hostId } } : {})
		});
		if (bucketUnit === 'day') {
			return {
				data: points.map((p) => ({ date: p.bucket, bookingsConfirmed: p.count })),
				meta: { metric: 'bookingsConfirmed' }
			};
		}
		const byMonth = new Map<number, number>();
		for (const p of points) {
			const m = monthStartOf(p.bucket);
			byMonth.set(m, (byMonth.get(m) ?? 0) + p.count);
		}
		return {
			data: [...byMonth.entries()].map(([date, bookingsConfirmed]) => ({ date, bookingsConfirmed })),
			meta: { metric: 'bookingsConfirmed' }
		};
	}

	if (metric === 'revenue') {
		// Global by design — the `__platform__` namespace is never a host's. The admin
		// dashboard is the only reader; a host's money lives under their `gmv` namespace.
		const ranges = bucketRanges(from, to, bucketUnit);
		const sums = await readSumSeries(ctx, platformRevenue, PLATFORM_REVENUE_NAMESPACE, ranges);
		return {
			data: ranges.map((r, i) => ({ date: r.start, revenue: sums[i] ?? 0 })),
			meta: { metric: 'revenue' }
		};
	}

	if (metric === 'refunds') {
		// One series per plan namespace, merged per bucket — `PLATFORM_PLANS` is the single
		// list to extend when Phase 2 lands (booking-fee refunds appear here automatically).
		const ranges = bucketRanges(from, to, bucketUnit);
		const perPlan = await Promise.all(
			PLATFORM_PLANS.map((plan) => readSumSeries(ctx, platformFeeRefunds, plan, ranges))
		);
		return {
			data: ranges.map((r, i) => {
				const point: SeriesPoint = { date: r.start };
				PLATFORM_PLANS.forEach((plan, j) => {
					point[plan] = perPlan[j][i] ?? 0;
				});
				return point;
			}),
			meta: { metric: 'refunds' }
		};
	}

	const agg = SUM_METRICS[metric];
	if (!agg) return { data: [], meta: { metric } };

	// Sum metrics are host-scoped; `hostId ?? ''` reads the (empty) namespace should a
	// global reader ever ask for one, yielding zeros rather than a wrong host's numbers.
	const ranges = bucketRanges(from, to, bucketUnit);
	const sums = await readSumSeries(ctx, agg, hostId ?? '', ranges);
	return {
		data: ranges.map((r, i) => ({ date: r.start, [metric]: sums[i] ?? 0 })),
		meta: { metric }
	};
}

export const analytics = {
	track: (ctx: MutationCtx, name: string, props: Record<string, string | number | boolean | null>) =>
		client.track(ctx, name, { props }),
	fetchTimeSeries
};

/**
 * Raw-event retention. vllnt keeps rollups forever but prunes raw events past `retentionDays`
 * (default 90). `prune` with no scope sweeps only scopes that HAVE a config row — and this
 * app never calls `configure`, so the explicit `'default'` is what actually deletes. Daily
 * in `convex/crons.ts`.
 */
export const pruneAnalyticsData = internalMutation({
	args: {},
	handler: async (ctx) => ctx.runMutation(components.analytics.internal_mutations.prune, { scope: 'default' })
});
