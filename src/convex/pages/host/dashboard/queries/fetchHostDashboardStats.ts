// LIBRARIES
import { query } from '@/convex/_generated/server';

// CONFIG
import { MS_PER_DAY, HOST_DASHBOARD, PROJECT_SETTINGS } from '@/shared/config';

// HELPERS
import { requireAuthUserId } from '@/convex/auth/helpers/requireAuthUserId';
import { resolveApartmentSummary } from '@/convex/tables/bookings/helpers/resolveApartmentSummary';

// UTILS
import { analytics, hostAnalyticsScopeInput } from '@/convex/analytics';
import { counters } from '@/convex/functions';
import { APARTMENT_STATUSES } from '@/convex/tables/accommodations/schemas/accommodationsSchemas';
import { todayInPropertyZone } from '@/shared/features/booking/utils/daysUntilCheckIn';
import { monthStartUtc, shiftIsoDate } from '@/shared/utils/dateUtils';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { QueryCtx } from '@/convex/_generated/server';
import type {
	HostDashboardStats,
	HostEarningsCard,
	HostToday,
	HostTodaySlice
} from '@/convex/pages/host/dashboard/types/hostDashboardTypes';

/** Resolve the first {@link HOST_DASHBOARD.TODAY_DISPLAY_LIMIT} bookings into lean guest lines. */
async function toTodaySlice(ctx: QueryCtx, bookings: Doc<'bookings'>[]): Promise<HostTodaySlice> {
	const items = await Promise.all(
		bookings.slice(0, HOST_DASHBOARD.TODAY_DISPLAY_LIMIT).map(async (booking) => {
			const apartment = await resolveApartmentSummary(ctx, booking);
			return {
				bookingId: booking._id,
				guestName: `${booking.guestFirstName} ${booking.guestLastName}`.trim(),
				accommodationTitle: apartment.title
			};
		})
	);
	return { items, total: bookings.length };
}

/**
 * Everything on the host dashboard except the live pending strip: the today strip, the
 * earnings card, and the stat tiles. (The trend chart and per-accommodation table moved to
 * `/host/analytics` — HostSystemDesign.md §2b.)
 *
 * Realtime verdict: **one-shot** (GeneralSystemDesignRule.md). None of it moves under the
 * host without them acting — listings change when they edit one elsewhere, the today strip
 * turns over on a day boundary, and the tiles are month-scale. Remounting the page refetches,
 * which is always fresh enough. The one genuinely live thing on this page has its own query.
 *
 * Cost control: hosts here are not one-apartment individuals — a sizeable minority own 100+
 * listings — so NOTHING in this query may scale with portfolio size:
 *   - listing counts are aggregate `count`s bounded to this host (O(log n)), and the
 *     deep-link slug is two `.first()` reads — the apartments table is never collected;
 *   - the held-earnings balance is an aggregate `sum` (O(log n)), never a scan;
 *   - revenue AND occupancy are two months of pre-aggregated rollups, not row reads. That
 *     occupancy can live here at all is the point of `booking.nights_booked`: "nights in
 *     July" is a function of (booking, window), which an aggregate's scalar `sumValue`
 *     cannot express, so the clipping was moved to write time (`nightsByMonth`) where it
 *     happens once instead of over every row on every dashboard load;
 *   - the single remaining table read is a SEVEN-DAY forward slice for upcoming check-ins.
 *
 * The trade occupancy makes (`GeneralSystemDesignRule.md` § table counts): it is now a
 * HAPPENED-question answered from an event ledger, not a NOW-question recomputed from rows.
 * It no longer self-heals — see `trackBookingNights` for the obligation that creates.
 */
export const fetchHostDashboardStats = query({
	args: {},
	handler: async (ctx): Promise<HostDashboardStats> => {
		const hostId = await requireAuthUserId(ctx);

		const now = Date.now();
		const today = todayInPropertyZone();

		// The two calendar months (UTC) the tiles compare — this month and last, for the deltas.
		const month = (offset: number) => {
			const startMs = monthStartUtc(now, offset);
			const endMs = monthStartUtc(now, offset - 1);
			return { startMs, days: (endMs - startMs) / MS_PER_DAY };
		};
		const lastMonth = month(1);
		const thisMonth = month(0);
		const in7Days = new Date(Date.parse(today) + 7 * MS_PER_DAY).toISOString().slice(0, 10);

		const scope = hostAnalyticsScopeInput(hostId);

		// Portfolio counts come from the aggregate, one O(log n) read per status, clamped to
		// this host's slice of each namespace. A `.collect().length` would pull every listing
		// document — photos, amenities, description — to produce three integers, and a
		// sizeable minority of hosts here own 100+ listings.
		const hostBounds = {
			lower: { key: hostId, inclusive: true },
			upper: { key: hostId, inclusive: true }
		} as const;

		const [
			upcomingRows,
			seriesByMonth,
			apartmentCounts,
			publishedFirst,
			anyFirst,
			anyBooking,
			arrivals,
			inHouse,
			payoutAccount,
			heldEuros
		] = await Promise.all([
			// The upcoming-check-ins tile, and the ONLY booking-history read left: a seven-day
			// forward slice, not the two months occupancy used to need.
			ctx.db
				.query('bookings')
				.withIndex('by_host_status_checkin', (q) =>
					q
						.eq('hostId', hostId)
						.eq('status', 'confirmed')
						.gte('checkInDate', today)
						.lte('checkInDate', in7Days)
				)
				.collect(),
			// Both month-scale tiles, from pre-aggregated rollups: revenue as
			// `gmv − gmvCancelled`, occupancy as `nightsBooked − nightsReleased`. Two months
			// only — the chart on /host/analytics owns the full twelve.
			Promise.all(
				(['gmv', 'gmvCancelled', 'nightsBooked', 'nightsReleased'] as const).map((metric) =>
					analytics.fetchTimeSeries(ctx, {
						metric,
						from: lastMonth.startMs,
						to: now,
						bucketUnit: 'month',
						scope
					})
				)
			).then((list) =>
				list.map((s) => new Map(s.data.map((p) => [p.date, p[s.meta.metric] ?? 0])))
			),
			Promise.all(
				APARTMENT_STATUSES.map((status) =>
					counters.apartments.aggregate
						.count(ctx, { namespace: status, bounds: hostBounds })
						.then((count) => [status, count] as const)
				)
			).then(
				(entries) => Object.fromEntries(entries) as Record<Doc<'apartments'>['status'], number>
			),
			// Deep-link target: the host's first published listing, else any listing at all.
			ctx.db
				.query('apartments')
				.withIndex('by_host_status', (q) => q.eq('hostId', hostId).eq('status', 'published'))
				.first(),
			ctx.db
				.query('apartments')
				.withIndex('by_host', (q) => q.eq('hostId', hostId))
				.first(),
			ctx.db
				.query('bookings')
				.withIndex('by_host', (q) => q.eq('hostId', hostId))
				.first(),
			// Today strip: today's arrivals + everyone currently in-house (departures = checkout today).
			ctx.db
				.query('bookings')
				.withIndex('by_host_status_checkin', (q) =>
					q.eq('hostId', hostId).eq('status', 'confirmed').eq('checkInDate', today)
				)
				.collect(),
			// Everyone currently in-house. Bounded on both ends: a guest cannot be in-house
			// having checked in after today, nor longer ago than a stay can last. Without
			// those, this collects every row ever stuck in `checked_in` — a set with no
			// ceiling of its own, since it depends on the lifecycle cron having drained it.
			ctx.db
				.query('bookings')
				.withIndex('by_host_status_checkin', (q) =>
					q
						.eq('hostId', hostId)
						.eq('status', 'checked_in')
						.gte('checkInDate', shiftIsoDate(today, -PROJECT_SETTINGS.MAX_STAY_NIGHTS))
						.lte('checkInDate', today)
				)
				.collect(),
			ctx.db
				.query('hostPayoutAccounts')
				.withIndex('by_host', (q) => q.eq('hostId', hostId))
				.first(),
			// A NOW-question about current rows, so the counter answers it in O(log n)
			// (GeneralSystemDesignRule.md § table counts). Earnings HISTORY stays analytics.
			counters.hostEarnings.aggregate.sum(ctx, {
				namespace: hostId,
				bounds: {
					lower: { key: 'held', inclusive: true },
					upper: { key: 'held', inclusive: true }
				}
			})
		]);

		const [gmvByMonth, gmvCancelledByMonth, nightsBookedByMonth, nightsReleasedByMonth] =
			seriesByMonth;

		// --- Today strip ---
		const [checkIns, checkOuts, hosting] = await Promise.all([
			toTodaySlice(ctx, arrivals),
			toTodaySlice(
				ctx,
				inHouse.filter((b) => b.checkOutDate === today)
			),
			toTodaySlice(ctx, inHouse)
		]);
		const todayStrip: HostToday = { checkIns, checkOuts, hosting };

		// --- Earnings card ---
		// A host who never takes online bookings never sees a payment surface, ever
		// (PaymentsSystemDesign.md §0.1).
		const earnings: HostEarningsCard | null =
			heldEuros > 0 || payoutAccount
				? { heldEuros, payable: payoutAccount?.transfersActive ?? false }
				: null;

		const publishedCount = apartmentCounts.published;

		// Occupancy comes out of the rollups already clipped to the month: the split happened
		// once at confirm time (`nightsByMonth`), not per row on every dashboard load.
		// `max(0, …)` because the ledger can only go negative through a bug, and a negative
		// occupancy bar is a worse failure than a zeroed one.
		const bookedNights = (bucket: typeof thisMonth) =>
			Math.max(
				0,
				(nightsBookedByMonth.get(bucket.startMs) ?? 0) -
					(nightsReleasedByMonth.get(bucket.startMs) ?? 0)
			);

		const occupancyPct = (bucket: typeof thisMonth) =>
			publishedCount > 0 ? (bookedNights(bucket) / (publishedCount * bucket.days)) * 100 : 0;

		const revenueFor = (bucket: typeof thisMonth) =>
			(gmvByMonth.get(bucket.startMs) ?? 0) - (gmvCancelledByMonth.get(bucket.startMs) ?? 0);

		const upcoming = upcomingRows.map((b) => b.checkInDate).sort();

		return {
			accommodations: {
				total: Object.values(apartmentCounts).reduce((sum, n) => sum + n, 0),
				published: publishedCount,
				pendingReview: apartmentCounts.pending_review
			},
			firstAccommodationSlug: publishedFirst?.slug ?? anyFirst?.slug ?? null,
			hasAnyBookings: anyBooking !== null,
			today: todayStrip,
			earnings,
			tiles: {
				occupancy: {
					pct: occupancyPct(thisMonth),
					deltaPts: occupancyPct(thisMonth) - occupancyPct(lastMonth)
				},
				revenue: {
					amount: revenueFor(thisMonth),
					deltaAmount: revenueFor(thisMonth) - revenueFor(lastMonth)
				},
				upcomingCheckIns: { count: upcoming.length, nextDate: upcoming[0] ?? null }
			}
		};
	}
});
