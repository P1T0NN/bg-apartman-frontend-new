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
 *
 * Idempotency: `insertIfDoesNotExist` keyed by `bookingId` (gmv) or `${bookingId}:${month}`
 * (nights), so a re-run of the backfill or a duplicate write is a no-op.
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
