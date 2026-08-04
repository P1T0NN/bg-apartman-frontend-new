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
import type { Doc, Id } from '@/convex/_generated/dataModel';
import type {
	HostAnalyticsData,
	HostAccommodationRow
} from '@/convex/pages/host/analytics/types/hostAnalyticsTypes';

/** Host-scoped rollup metrics behind the trend chart, in destructuring order. */
const SERIES_METRICS = ['gmv', 'gmvCancelled', 'bookingsConfirmed'] as const;

/** Statuses that can still be somebody's next arrival — a finished stay never is. */
const UPCOMING_STAY_STATUSES = ['confirmed', 'checked_in'] as const;

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
	const year = first.getUTCFullYear();
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
 * Cost shape — nothing here may grow with the host's booking VOLUME, because this query
 * refires on every click of the period picker:
 *   - the series reads the analytics component's PRE-AGGREGATED rollups (host-scoped),
 *     never the bookings table — same cost at ten bookings or ten thousand;
 *   - the table's booking read is bounded on BOTH sides of the window. The lookback below
 *     `from` is what lets a stay straddling the window edge contribute its clipped nights
 *     via `nightsWithinWindow` instead of vanishing; the bound above `to` is what stops a
 *     7-day window from dragging in the host's entire forward booking book;
 *   - "next check-in" is the one genuinely window-independent column, so it is NOT taken
 *     from that read. It is one indexed `.first()` per listing per upcoming status —
 *     O(listings · log n), flat in booking volume;
 *   - listings are read published-only off `by_host_status`, and bucketed into a Map once,
 *     so the table is O(listings + bookings) rather than O(listings · bookings).
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
			// Published only, straight off the index — the table renders no other status, and
			// an unfiltered `by_host` collect pulls every draft's photos, amenities and
			// description along with it. Some hosts here own 100+ listings.
			ctx.db
				.query('apartments')
				.withIndex('by_host_status', (q) => q.eq('hostId', hostId).eq('status', 'published'))
				.collect(),
			// Earning statuses only — the same set every stat treats as "money" — and clamped
			// to the window at both ends. Rows checking in after `to` contribute nothing to
			// either revenue or clipped nights, so reading them was pure waste.
			Promise.all(
				PROJECT_SETTINGS.BOOKING_EARNING_STATUSES.map((status) =>
					ctx.db
						.query('bookings')
						.withIndex('by_host_status_checkin', (q) =>
							q
								.eq('hostId', hostId)
								.eq('status', status)
								.gte('checkInDate', readFromIso)
								.lte('checkInDate', toIso)
						)
						.collect()
				)
			)
		]);

		const [gmvByBucket, gmvCancelledByBucket, confirmedByBucket] = metricMaps;

		// Bucket the window's bookings by listing in ONE pass. Re-filtering the flat array
		// inside the per-listing map below is what made this table O(listings · bookings).
		const earningByApartment = new Map<Id<'apartments'>, Doc<'bookings'>[]>();
		for (const booking of earningRows.flat()) {
			const bucket = earningByApartment.get(booking.apartmentId);
			if (bucket) bucket.push(booking);
			else earningByApartment.set(booking.apartmentId, [booking]);
		}

		// The next arrival per listing, asked of the index directly. It is deliberately NOT
		// derived from the window read above: "next check-in" looks forward from today with no
		// upper bound, and serving it from that read is what forced the read to be unbounded.
		const nextCheckIns = await Promise.all(
			apartments.map(async (apartment) => {
				const soonest = await Promise.all(
					UPCOMING_STAY_STATUSES.map((status) =>
						ctx.db
							.query('bookings')
							.withIndex('by_apartment_status_checkin', (q) =>
								q.eq('apartmentId', apartment._id).eq('status', status).gte('checkInDate', today)
							)
							.first()
					)
				);

				const dates = soonest
					.map((booking) => booking?.checkInDate)
					.filter((date): date is string => date !== undefined)
					.sort();

				return dates[0] ?? null;
			})
		);

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
		// performance, one row is still the answer. `nextCheckIns` is index-aligned with
		// `apartments`, so it is read before the sort reorders anything.
		const perAccommodation: HostAccommodationRow[] = apartments
			.map((apartment, index) => {
				const mine = earningByApartment.get(apartment._id) ?? [];

				let revenue = 0;
				let bookedNights = 0;
				for (const booking of mine) {
					// Revenue counts a stay in the window it STARTS in; nights are clipped to the
					// window, which is what lets a straddling stay count its inside half.
					if (booking.checkInDate >= fromIso) revenue += booking.total;
					bookedNights += nightsWithinWindow(booking.checkInDate, booking.checkOutDate, from, to);
				}

				return {
					apartmentId: apartment._id,
					title: apartment.title,
					imageUrl: apartment.images[0]?.url ?? '',
					status: apartment.status,
					occupancyPct: Math.min(100, (bookedNights / windowDays) * 100),
					revenue,
					nextCheckIn: nextCheckIns[index]
				};
			})
			// Best performers first — the question is "which of my places is carrying me".
			.sort((a, b) => b.occupancyPct - a.occupancyPct);

		return { series, bucketUnit, perAccommodation };
	}
});
