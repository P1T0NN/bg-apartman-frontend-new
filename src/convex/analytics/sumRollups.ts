// LIBRARIES
import { DirectAggregate } from '@convex-dev/aggregate';

// CONFIG
import { components } from '@/convex/_generated/api';

// UTILS
import { nightsByMonth } from '@/shared/features/booking/utils/nightsByMonth';

// TYPES
import type { QueryCtx, MutationCtx } from '@/convex/_generated/server';
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Write-time SUM rollups for money + occupancy — the one thing `@vllnt/convex-analytics`
 * cannot do (its `timeseries` is COUNT-only). Each is a `DirectAggregate` keyed by time
 * bucket, summed over a numeric field, partitioned per host by `namespace`.
 *
 * - gmv / gmvCancelled: DAY-keyed (confirm/cancel time), sum of `booking.total`. Read at day
 *   or month granularity by summing the day range that makes up each bucket.
 * - nightsBooked / nightsReleased: MONTH-keyed (the stay split by `nightsByMonth`), sum of
 *   nights. Read at month granularity only — /host/analytics charts money+bookings, not
 *   occupancy.
 * - platformRevenue: DAY-keyed cents, one GLOBAL `__platform__` namespace (never per-host).
 *   Written by `stampListingFeePayment`; read by /admin/dashboard's `revenue` metric.
 * - platformFeeRefunds: DAY-keyed cents, namespace = the plan. `listing_fee` now;
 *   `booking_fee` when Phase 2 lands. Read per plan by the `refunds` metric.
 *
 * Idempotency: `insertIfDoesNotExist` keyed by `bookingId` (gmv), `${bookingId}:${month}`
 * (nights), or `invoice.paid:${paymentRef}` / `refund.created:${paymentRef}` (platform) — a
 * redelivered webhook or a re-run backfill is a no-op, and a re-pay after refund gets its
 * own row (fresh `paymentRef`).
 */

export type SumAggregate = DirectAggregate<{ Key: number; Id: string; Namespace: string }>;

const gmv = new DirectAggregate<{ Key: number; Id: string; Namespace: string }>(
	components.aggregateGmv
);
const gmvCancelled = new DirectAggregate<{ Key: number; Id: string; Namespace: string }>(
	components.aggregateGmvCancelled
);
const nightsBooked = new DirectAggregate<{ Key: number; Id: string; Namespace: string }>(
	components.aggregateNightsBooked
);
const nightsReleased = new DirectAggregate<{ Key: number; Id: string; Namespace: string }>(
	components.aggregateNightsReleased
);
export const platformRevenue = new DirectAggregate<{ Key: number; Id: string; Namespace: string }>(
	components.aggregatePlatformRevenue
);
export const platformFeeRefunds = new DirectAggregate<{ Key: number; Id: string; Namespace: string }>(
	components.aggregatePlatformFeeRefunds
);

/** UTC midnight of the day containing `ms` — the gmv key convention. */
export function dayStartUtc(ms: number): number {
	const d = new Date(ms);
	return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

type GmvSource = { _id: Id<'bookings'>; hostId: string; total: number };
type NightsSource = { _id: Id<'bookings'>; hostId: string; checkInDate: string; checkOutDate: string };

/** Record a booking's total into gmv (confirmed) or gmvCancelled (cancelled-after-confirm). */
export function recordGmv(
	ctx: MutationCtx,
	booking: GmvSource,
	direction: 'confirmed' | 'cancelled'
): Promise<void> {
	const agg = direction === 'cancelled' ? gmvCancelled : gmv;
	return agg.insertIfDoesNotExist(ctx, {
		namespace: booking.hostId,
		key: dayStartUtc(Date.now()),
		id: booking._id,
		sumValue: booking.total
	});
}

/**
 * Record the occupancy ledger for one booking, split per calendar month the stay touches.
 * `'booked'` pairs with gmv's `'confirmed'`, `'released'` with `'cancelled'` — the two stay
 * balanced so the dashboard can read occupancy as `nightsBooked − nightsReleased`. Emit
 * `'released'` ONLY when a booking leaves an earning status, or occupancy drives negative.
 */
export async function recordNights(
	ctx: MutationCtx,
	booking: NightsSource,
	direction: 'booked' | 'released'
): Promise<void> {
	const agg = direction === 'released' ? nightsReleased : nightsBooked;
	for (const { monthStartMs, nights } of nightsByMonth(booking.checkInDate, booking.checkOutDate)) {
		await agg.insertIfDoesNotExist(ctx, {
			namespace: booking.hostId,
			key: monthStartMs,
			id: `${booking._id}:${monthStartMs}`,
			sumValue: nights
		});
	}
}

/**
 * The namespace every platform-revenue point lives under — global by design, never a
 * host's (the host's money lives under their `gmv` namespace). Named so the writer
 * (`stampListingFeePayment`) and the reader (`fetchTimeSeries`'s `revenue` metric) can't
 * drift apart: a namespace typo would silently split the money.
 */
export const PLATFORM_REVENUE_NAMESPACE = '__platform__';

/**
 * The plans whose fee refunds subtract from platform revenue — the namespaces of
 * `platformFeeRefunds`. `booking_fee` has no writer yet (Phase 2); it exists so the
 * dashboard's refunds metric already carries the key instead of the reader growing a
 * `booking_fee` branch later. Phase 2 touches ONLY this list.
 */
export const PLATFORM_PLANS = ['booking_fee', 'listing_fee'] as const;

/** Record a paid listing fee into platform revenue (cents). Fired by `stampListingFeePayment`. */
export function recordPlatformRevenue(
	ctx: MutationCtx,
	paymentRef: string,
	amountCents: number
): Promise<void> {
	return platformRevenue.insertIfDoesNotExist(ctx, {
		namespace: PLATFORM_REVENUE_NAMESPACE,
		key: dayStartUtc(Date.now()),
		id: `invoice.paid:${paymentRef}`,
		sumValue: amountCents
	});
}

/**
 * Record a refunded listing fee into `platformFeeRefunds` (cents), namespace `'listing_fee'`
 * — the only plan with a refund writer today (Phase 2 brings booking-fee refunds; the reader
 * already merges `PLATFORM_PLANS`). Fired by `resetListingAfterRefund`, so /admin/dashboard
 * revenue nets to zero for the refunded period.
 */
export function recordPlatformFeeRefund(
	ctx: MutationCtx,
	paymentRef: string,
	amountCents: number
): Promise<void> {
	return platformFeeRefunds.insertIfDoesNotExist(ctx, {
		namespace: 'listing_fee',
		key: dayStartUtc(Date.now()),
		id: `refund.created:${paymentRef}`,
		sumValue: amountCents
	});
}

/** Sum `agg` over `[start, end)` ranges (upper bound exclusive), one number per bucket. */
export function readSumSeries(
	ctx: QueryCtx,
	agg: SumAggregate,
	namespace: string,
	buckets: Array<{ start: number; end: number }>
): Promise<number[]> {
	if (buckets.length === 0) return Promise.resolve([]);
	return agg.sumBatch(
		ctx,
		buckets.map(({ start, end }) => ({
			namespace,
			bounds: { lower: { key: start, inclusive: true }, upper: { key: end, inclusive: false } }
		}))
	);
}

export const sumAggregates = { gmv, gmvCancelled, nightsBooked, nightsReleased } as const;
