// LIBRARIES
import { ConvexError } from 'convex/values';
import { query } from '@/convex/_generated/server';

// CONFIG
import { PROJECT_SETTINGS } from '@/shared/config';

// HELPERS
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';
import { resolveApartmentSummary } from '@/convex/tables/bookings/helpers/resolveApartmentSummary';

// UTILS
import { analytics, hostAnalyticsScopeInput } from '@/convex/analytics';
import { bookingToBookingSafe } from '@/convex/tables/bookings/utils/bookingToBookingSafe';
import { todayIsoUtc } from '@/shared/features/booking/utils/daysUntilCheckIn';
import { monthStartUtc } from '@/shared/utils/dateUtils';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { QueryCtx } from '@/convex/_generated/server';
import type { ConvexErrorPayload } from '@/shared/types/types';
import type {
	HostDashboardData,
	HostDashboardStats,
	HostPendingReservations,
	HostToday,
	HostTodaySlice
} from '@/convex/pages/host/dashboard/types/hostDashboardTypes';

const MS_PER_DAY = 86_400_000;

/** Today strip: how many arrivals/departures/in-house rows to enrich into guest lines. */
const TODAY_DISPLAY_LIMIT = 3;
/** Pending reservations: rows to enrich for the dashboard strip. */
const QUEUE_DISPLAY_LIMIT = 5;
/** Pending reservations: bounded count for the strip (UI renders "50+" past the cap). */
const QUEUE_COUNT_CAP = 50;

/** Host-scoped rollup metrics behind the chart + revenue tile, in destructuring order. */
const SERIES_METRICS = ['gmv', 'gmvCancelled', 'bookingsConfirmed', 'bookingsCancelled'] as const;

/** Nights of a stay that fall inside [startMs, endMs) — clips multi-month stays to the month. */
function nightsInRange(checkIn: string, checkOut: string, startMs: number, endMs: number): number {
	const ci = Date.parse(`${checkIn}T00:00:00Z`);
	const co = Date.parse(`${checkOut}T00:00:00Z`);
	if (Number.isNaN(ci) || Number.isNaN(co)) return 0;
	return Math.max(0, (Math.min(co, endMs) - Math.max(ci, startMs)) / MS_PER_DAY);
}

/** Resolve the first {@link TODAY_DISPLAY_LIMIT} bookings into lean guest/accommodation lines. */
async function toTodaySlice(ctx: QueryCtx, bookings: Doc<'bookings'>[]): Promise<HostTodaySlice> {
	const items = await Promise.all(
		bookings.slice(0, TODAY_DISPLAY_LIMIT).map(async (booking) => {
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
 * Everything the host dashboard (`/host/dashboard`) renders, in one subscription: the pending
 * reservations strip, the today strip (arrivals/departures/in-house), and the stats block
 * (tiles, 12-month revenue chart, per-accommodation table).
 *
 * The 12-month revenue/bookings series and the revenue tile read the analytics component's
 * pre-aggregated rollups (host-scoped `booking.confirmed` / `booking.cancelled` events), so
 * they're bucketed by EVENT month (when the booking was confirmed/cancelled), not stay month.
 * State math stays on index-bounded table reads: occupancy + the per-accommodation table only
 * need last + current month of earning bookings, and the pending/today strips are tiny
 * `by_host_status_checkin` slices.
 */
export const fetchHostDashboardPageSafe = query({
	args: {},
	handler: async (ctx): Promise<HostDashboardData> => {
		const hostId = await getAuthUserId(ctx);
		if (!hostId) {
			throw new ConvexError({
				code: 'NOT_AUTHENTICATED',
				message: { key: 'GenericMessages.NOT_AUTHENTICATED' }
			} satisfies ConvexErrorPayload);
		}

		const now = Date.now();
		const today = todayIsoUtc();

		// Occupancy + per-accommodation math only reads last + current calendar month (UTC).
		const month = (offset: number) => {
			const startMs = monthStartUtc(now, offset);
			const endMs = monthStartUtc(now, offset - 1);
			return { startMs, endMs, days: (endMs - startMs) / MS_PER_DAY, bookedNights: 0 };
		};
		const lastMonth = month(1);
		const thisMonth = month(0);
		const windowStart = new Date(lastMonth.startMs).toISOString().slice(0, 10);

		const scope = hostAnalyticsScopeInput(hostId);
		const seriesFrom = monthStartUtc(now, 11);

		const [
			earningRows,
			[gmvByMonth, gmvCancelledByMonth, confirmedByMonth, cancelledByMonth],
			apartments,
			anyBooking,
			pending,
			arrivals,
			inHouse
		] = await Promise.all([
			// Earning bookings checking in since last month (and any future-dated ones), per
			// status — never pending/declined/cancelled: the same set the stats treat as "money".
			Promise.all(
				PROJECT_SETTINGS.BOOKING_EARNING_STATUSES.map((status) =>
					ctx.db
						.query('bookings')
						.withIndex('by_host_status_checkin', (q) =>
							q.eq('hostId', hostId).eq('status', status).gte('checkInDate', windowStart)
						)
						.collect()
				)
			),
			// Chart + revenue tile metrics as Map(UTC month start → value), one per metric.
			Promise.all(
				SERIES_METRICS.map((metric) =>
					analytics.fetchTimeSeries(ctx, {
						metric,
						from: seriesFrom,
						to: now,
						bucketUnit: 'month',
						scope
					})
				)
			).then((list) =>
				list.map((s) => new Map(s.data.map((p) => [p.date, p[s.meta.metric] ?? 0])))
			),
			ctx.db
				.query('apartments')
				.withIndex('by_host', (q) => q.eq('hostId', hostId))
				.collect(),
			ctx.db
				.query('bookings')
				.withIndex('by_host', (q) => q.eq('hostId', hostId))
				.first(),
			// Pending queue — bounded read; sorted by expiry in JS (index orders by check-in date).
			ctx.db
				.query('bookings')
				.withIndex('by_host_status_checkin', (q) => q.eq('hostId', hostId).eq('status', 'pending'))
				.take(QUEUE_COUNT_CAP + 1),
			// Today strip: today's arrivals + everyone currently in-house (departures = checkout today).
			ctx.db
				.query('bookings')
				.withIndex('by_host_status_checkin', (q) =>
					q.eq('hostId', hostId).eq('status', 'confirmed').eq('checkInDate', today)
				)
				.collect(),
			ctx.db
				.query('bookings')
				.withIndex('by_host_status_checkin', (q) =>
					q.eq('hostId', hostId).eq('status', 'checked_in')
				)
				.collect()
		]);
		const earning = earningRows.flat();

		// --- Pending reservations ---
		const pendingReservations: HostPendingReservations = {
			items: await Promise.all(
				pending
					.sort((a, b) => (a.pendingExpiresAt ?? Infinity) - (b.pendingExpiresAt ?? Infinity))
					.slice(0, QUEUE_DISPLAY_LIMIT)
					.map((booking) => bookingToBookingSafe(ctx, booking))
			),
			total: Math.min(pending.length, QUEUE_COUNT_CAP),
			capped: pending.length > QUEUE_COUNT_CAP
		};

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

		// --- Stats block ---
		// 12 trailing months, zero-filled (rollups only return non-empty buckets). Net per month
		// = confirmed − cancelled-after-confirmation, same rule as admin GMV.
		const series = Array.from({ length: 12 }, (_, i) => {
			const date = monthStartUtc(now, 11 - i);
			return {
				date,
				revenue: (gmvByMonth.get(date) ?? 0) - (gmvCancelledByMonth.get(date) ?? 0),
				bookings: (confirmedByMonth.get(date) ?? 0) - (cancelledByMonth.get(date) ?? 0)
			};
		});

		// Occupancy nights: spread each stay across the two months it may overlap.
		for (const b of earning) {
			for (const bucket of [lastMonth, thisMonth]) {
				bucket.bookedNights += nightsInRange(
					b.checkInDate,
					b.checkOutDate,
					bucket.startMs,
					bucket.endMs
				);
			}
		}

		const published = apartments.filter((a) => a.status === 'published');
		const publishedCount = published.length;
		const thisMonthKey = new Date(thisMonth.startMs).toISOString().slice(0, 7); // 'YYYY-MM'

		const occupancyPct = (bucket: typeof thisMonth) =>
			publishedCount > 0 ? (bucket.bookedNights / (publishedCount * bucket.days)) * 100 : 0;

		const in7Days = new Date(Date.parse(today) + 7 * MS_PER_DAY).toISOString().slice(0, 10);
		const upcoming = earning
			.filter((b) => b.status === 'confirmed' && b.checkInDate >= today && b.checkInDate <= in7Days)
			.map((b) => b.checkInDate)
			.sort();

		const perAccommodation: HostDashboardStats['perAccommodation'] =
			publishedCount >= 2
				? published.map((a) => {
						const mine = earning.filter((b) => b.apartmentId === a._id);
						const revenue = mine
							.filter((b) => b.checkInDate.slice(0, 7) === thisMonthKey)
							.reduce((sum, b) => sum + b.total, 0);
						const bookedNights = mine.reduce(
							(sum, b) =>
								sum +
								nightsInRange(b.checkInDate, b.checkOutDate, thisMonth.startMs, thisMonth.endMs),
							0
						);
						const nextCheckIn = mine
							.filter(
								(b) =>
									(b.status === 'confirmed' || b.status === 'checked_in') && b.checkInDate >= today
							)
							.map((b) => b.checkInDate)
							.sort()[0];
						return {
							apartmentId: a._id,
							title: a.title,
							imageUrl: a.images[0]?.url ?? '',
							status: a.status,
							occupancyPct: (bookedNights / thisMonth.days) * 100,
							revenue,
							nextCheckIn: nextCheckIn ?? null
						};
					})
				: [];

		const stats: HostDashboardStats = {
			accommodations: {
				total: apartments.length,
				published: publishedCount,
				pendingReview: apartments.filter((a) => a.status === 'pending_review').length
			},
			firstAccommodationSlug: published[0]?.slug ?? apartments[0]?.slug ?? null,
			hasAnyBookings: anyBooking !== null,
			tiles: {
				occupancy: {
					pct: occupancyPct(thisMonth),
					deltaPts: occupancyPct(thisMonth) - occupancyPct(lastMonth)
				},
				revenue: {
					amount: series[11].revenue,
					deltaAmount: series[11].revenue - series[10].revenue
				},
				upcomingCheckIns: { count: upcoming.length, nextDate: upcoming[0] ?? null }
			},
			series,
			perAccommodation
		};

		return { pendingReservations, today: todayStrip, stats };
	}
});
