// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// CONFIG
import { PROJECT_SETTINGS, MS_PER_DAY } from '@/shared/config';

// HELPERS
import { requireAuthUserId } from '@/convex/auth/helpers/requireAuthUserId';

// UTILS
import { analytics, hostAnalyticsScopeInput } from '@/convex/analytics';
import { todayInPropertyZone } from '@/shared/features/booking/utils/daysUntilCheckIn';
import { nightsWithinWindow } from '@/shared/features/booking/utils/nightsWithinWindow';

// TYPES
import type {
	HostAnalyticsData,
	HostAccommodationRow
} from '@/convex/pages/host/analytics/types/hostAnalyticsTypes';

/** Host-scoped rollup metrics behind the trend chart, in destructuring order. */
const SERIES_METRICS = ['gmv', 'gmvCancelled', 'bookingsConfirmed'] as const;

/** Above this, daily points are noise and the chart switches to month buckets. */
const DAY_BUCKET_MAX_DAYS = 92;

/** The analytics component refuses ranges beyond a year (`maxQueryRangeDays`). */
const MAX_WINDOW_DAYS = 366;

/**
 * How far before the window we read bookings: a stay that STARTED before the window can
 * still occupy nights inside it, and `nightsWithinWindow` clips it — but only if the row
 * was read at all. 90 days comfortably exceeds any real stay length.
 */
const STRADDLE_LOOKBACK_MS = 90 * MS_PER_DAY;

/** UTC midnight of the day containing `ms`. */
function dayStartUtc(ms: number): number {
	const d = new Date(ms);
	return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Every UTC bucket start covering [from, to] — the chart's zero-fill skeleton. */
function bucketStarts(from: number, to: number, unit: 'day' | 'month'): number[] {
	const starts: number[] = [];

	if (unit === 'day') {
		for (let ms = dayStartUtc(from); ms <= to; ms += MS_PER_DAY) starts.push(ms);
		return starts;
	}

	const first = new Date(from);
	let year = first.getUTCFullYear();
	let month = first.getUTCMonth();
	for (let ms = Date.UTC(year, month, 1); ms <= to; ms = Date.UTC(year, month, 1)) {
		starts.push(ms);
		month += 1;
	}
	return starts;
}

/**
 * Everything `/host/analytics` renders (HostSystemDesign.md §2b), over ONE caller-chosen
 * window — the page's 7d/30d/90d/custom picker sends `[from, to]` and every surface on the
 * page (trend chart AND per-listing table) answers for exactly that window, so the two can
 * never describe different periods.
 *
 * The server picks the bucket size (`day` up to ~3 months, `month` beyond) and returns it,
 * so the chart's axis labels follow the data instead of guessing.
 *
 * Realtime verdict: **one-shot** (GeneralSystemDesignRule.md). Aggregates over a chosen
 * window don't visibly move while a host looks at them — the page refetches on every
 * window change, which is always fresh enough.
 *
 * Cost shape:
 *   - the series reads the analytics component's PRE-AGGREGATED rollups (host-scoped),
 *     never the bookings table — same cost at ten bookings or ten thousand;
 *   - the table reads index-bounded `by_host_status_checkin` slices starting a lookback
 *     before the window (a stay straddling the window edge contributes its clipped nights
 *     via `nightsWithinWindow`, not zero).
 */
export const fetchHostAnalyticsSafe = query({
	args: {
		/** Window start, epoch ms (inclusive). */
		from: v.number(),
		/** Window end, epoch ms (inclusive). */
		to: v.number()
	},
	handler: async (ctx, args): Promise<HostAnalyticsData> => {
		const hostId = await requireAuthUserId(ctx);

		const { from, to } = args;
		if (!(from < to)) throw new Error('[fetchHostAnalyticsSafe] `from` must precede `to`.');
		if (to - from > MAX_WINDOW_DAYS * MS_PER_DAY) {
			throw new Error(`[fetchHostAnalyticsSafe] Window exceeds ${MAX_WINDOW_DAYS} days.`);
		}

		const today = todayInPropertyZone();
		const scope = hostAnalyticsScopeInput(hostId);

		const windowDays = (to - from) / MS_PER_DAY;
		const bucketUnit: 'day' | 'month' = windowDays <= DAY_BUCKET_MAX_DAYS ? 'day' : 'month';

		// Bookings are read from a lookback before the window so edge-straddling stays clip
		// instead of vanishing; dates compare as ISO strings, same as the index stores them.
		const readFromIso = new Date(from - STRADDLE_LOOKBACK_MS).toISOString().slice(0, 10);
		const fromIso = new Date(from).toISOString().slice(0, 10);
		const toIso = new Date(to).toISOString().slice(0, 10);

		const [metricMaps, apartments, earningRows] = await Promise.all([
			// One Map per metric: UTC bucket start → value.
			Promise.all(
				SERIES_METRICS.map((metric) =>
					analytics.fetchTimeSeries(ctx, { metric, from, to, bucketUnit, scope })
				)
			).then((list) =>
				list.map((s) => new Map(s.data.map((p) => [p.date, p[s.meta.metric] ?? 0])))
			),
			ctx.db
				.query('apartments')
				.withIndex('by_host', (q) => q.eq('hostId', hostId))
				.collect(),
			// Earning statuses only — the same set every stat treats as "money".
			Promise.all(
				PROJECT_SETTINGS.BOOKING_EARNING_STATUSES.map((status) =>
					ctx.db
						.query('bookings')
						.withIndex('by_host_status_checkin', (q) =>
							q.eq('hostId', hostId).eq('status', status).gte('checkInDate', readFromIso)
						)
						.collect()
				)
			)
		]);

		const [gmvByBucket, gmvCancelledByBucket, confirmedByBucket] = metricMaps;
		const earning = earningRows.flat();

		// Zero-filled: rollups only return non-empty buckets, but the chart needs every slot
		// or the x-axis lies.
		//
		// Revenue is NET per bucket (confirmed − cancelled-after-confirmation, same rule as
		// admin GMV): a refunded stay is money taken back, and a dip below zero is a true
		// statement about a bad week. Bookings are GROSS confirmations: "−1 bookings" reads
		// as nonsense to a host — a cancellation shows up in the money line, not as a
		// negative count.
		const series = bucketStarts(from, to, bucketUnit).map((date) => ({
			date,
			revenue: (gmvByBucket.get(date) ?? 0) - (gmvCancelledByBucket.get(date) ?? 0),
			bookings: confirmedByBucket.get(date) ?? 0
		}));

		// Every published listing — no "at least two" gate: on a page a host opened to study
		// performance, one row is still the answer.
		const perAccommodation: HostAccommodationRow[] = apartments
			.filter((a) => a.status === 'published')
			.map((a) => {
				const mine = earning.filter((b) => b.apartmentId === a._id);
				const revenue = mine
					.filter((b) => b.checkInDate >= fromIso && b.checkInDate <= toIso)
					.reduce((sum, b) => sum + b.total, 0);
				const bookedNights = mine.reduce(
					(sum, b) => sum + nightsWithinWindow(b.checkInDate, b.checkOutDate, from, to),
					0
				);
				const nextCheckIn = mine
					.filter(
						(b) => (b.status === 'confirmed' || b.status === 'checked_in') && b.checkInDate >= today
					)
					.map((b) => b.checkInDate)
					.sort()[0];

				return {
					apartmentId: a._id,
					title: a.title,
					imageUrl: a.images[0]?.url ?? '',
					status: a.status,
					occupancyPct: Math.min(100, (bookedNights / windowDays) * 100),
					revenue,
					nextCheckIn: nextCheckIn ?? null
				};
			})
			// Best performers first — the question is "which of my places is carrying me".
			.sort((a, b) => b.occupancyPct - a.occupancyPct);

		return { series, bucketUnit, perAccommodation };
	}
});
