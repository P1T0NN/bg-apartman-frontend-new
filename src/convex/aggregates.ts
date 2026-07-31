// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';
import { v } from 'convex/values';

// UTILS
import { OPERATIONAL_LIMITS } from '@/shared/config';
import { components, internal } from '@/convex/_generated/api';
import { internalMutation } from '@/convex/_generated/server';

// TYPES
import type { DataModel, Doc } from '@/convex/_generated/dataModel';

/**
 * O(log n) table-count aggregates (`@convex-dev/aggregate`).
 *
 * Scope per GeneralSystemDesignRule.md § table counts: these exist for COUNTS of table
 * state only ("how many rows are X right now"). Event analytics — funnels, revenue,
 * time series, "how many happened today" — stay in `@piton-/analytics-convex`.
 *
 * Kept in sync automatically: every write to an aggregated table flows through the
 * trigger-wrapped `mutation` / `internalMutation` from `@/convex/functions` (see that
 * file — writes via the raw `_generated/server` constructors would silently drift the
 * counts). Reads are `aggregateX.count(ctx, ...)` — never `.collect().length`.
 */

/**
 * Reports namespaced by inbox status — `count(ctx, { namespace: 'new', bounds: {} })` is
 * the sidebar badge and the dashboard's "needs attention" number
 * (AdminPagesSystemDesign.md §1/§4).
 *
 * The namespace normalizes `undefined → 'new'`, which is what lets the schema field stay
 * optional and legacy rows stay unmigrated. ⚠️ This namespace was ADDED after the
 * aggregate first shipped — a changed definition invalidates the stored tree, so it needs
 * the clear + re-backfill ritual below.
 */
export const aggregateReports = new TableAggregate<{
	Namespace: NonNullable<Doc<'reports'>['status']>;
	Key: null;
	DataModel: DataModel;
	TableName: 'reports';
}>(components.aggregateReports, {
	namespace: (doc) => doc.status ?? 'new',
	sortKey: () => null
});

/**
 * Apartments namespaced by status, keyed by host id. The key exists so ONE tree serves
 * both readers instead of a second component duplicating every write:
 * - platform-wide (admin sidebar): `count(ctx, { namespace: 'pending_review', bounds: {} })`
 * - per host (host dashboard):     same namespace, bounds clamped to `[hostId, hostId]`
 *
 * Per-host counts matter because hosts here are not one-apartment individuals — a sizeable
 * minority own 100+ listings, so `.collect()`-and-count on the host dashboard would pull
 * hundreds of fat documents (photos, amenities, description) to produce three integers.
 *
 * ⚠️ The sort key was ADDED after this aggregate first shipped — a changed definition
 * invalidates the stored tree, so it needs the clear + re-backfill ritual below.
 */
export const aggregateApartments = new TableAggregate<{
	Namespace: Doc<'apartments'>['status'];
	Key: string;
	DataModel: DataModel;
	TableName: 'apartments';
}>(components.aggregateApartments, {
	namespace: (doc) => doc.status,
	sortKey: (doc) => doc.hostId
});

/**
 * Host earnings namespaced by host, keyed by earning status, summing `net`.
 *
 * The stage-3 payout card's "€X waiting" is the held balance:
 * `sum(ctx, { namespace: hostId, bounds: { lower: { key: 'held', inclusive: true }, upper: { key: 'held', inclusive: true } } })`
 * — a NOW-question about current rows (PaymentsSystemDesign.md §5). Earnings *history*
 * and trends stay analytics events, per GeneralSystemDesignRule.md § table counts.
 */
export const aggregateHostEarnings = new TableAggregate<{
	Namespace: string;
	Key: Doc<'bookingEarnings'>['status'];
	DataModel: DataModel;
	TableName: 'bookingEarnings';
}>(components.aggregateHostEarnings, {
	namespace: (doc) => doc.hostId,
	sortKey: (doc) => doc.status,
	sumValue: (doc) => doc.net
});

/**
 * Bookings namespaced by status, keyed by check-in date (ISO string, so bounds compare the
 * way the `by_*_status_checkin` indexes already do). Powers the admin dashboard's pulse row
 * (AdminDashboardPageSystemDesign.md §3):
 * - check-ins today: `count(ctx, { namespace: 'confirmed', bounds: { lower/upper: today } })`
 * - pending open:    `count(ctx, { namespace: 'pending', bounds: {} })`
 */
export const aggregateBookings = new TableAggregate<{
	Namespace: Doc<'bookings'>['status'];
	Key: string;
	DataModel: DataModel;
	TableName: 'bookings';
}>(components.aggregateBookings, {
	namespace: (doc) => doc.status,
	sortKey: (doc) => doc.checkInDate
});

/**
 * One-time backfill of pre-existing rows into an aggregate. Idempotent
 * (`insertIfDoesNotExist`), paginated, self-scheduling until the table is drained.
 *
 * Run once per table after the component ships (and never again — triggers own it from
 * then on):
 * ```bash
 * bunx convex run aggregates:backfillAggregates '{"table":"reports"}'
 * bunx convex run aggregates:backfillAggregates '{"table":"apartments"}'
 * bunx convex run aggregates:backfillAggregates '{"table":"bookingEarnings"}'
 * bunx convex run aggregates:backfillAggregates '{"table":"bookings"}'
 * ```
 *
 * Also re-run for a table whose aggregate DEFINITION changed (namespace / sort key / sum),
 * after clearing that component with {@link clearAggregate} — a changed definition
 * invalidates the stored tree.
 *
 * ⚠️ **ALWAYS {@link clearAggregate} first when RE-PROVISIONING a component that existed
 * before.** A Convex component keeps its stored data across being removed from
 * `convex.config.ts` and added back, so a backfill onto a resurrected tree ADDS to whatever
 * was already in it and every count reads high. This bit `aggregateBookings` on dev
 * (2026-07-31): it shipped early, was removed unused, and when re-added for the admin
 * dashboard the rows that existed in its first life were counted twice — the dashboard
 * reported 2 pending requests against 1 real one. The backfill itself is genuinely
 * idempotent (verified: re-running it changes nothing); the duplication comes from the
 * pre-existing tree, which only `clearAggregate` removes.
 */
export const backfillAggregates = internalMutation({
	args: {
		table: v.union(
			v.literal('reports'),
			v.literal('apartments'),
			v.literal('bookingEarnings'),
			v.literal('bookings')
		),
		cursor: v.optional(v.union(v.string(), v.null()))
	},
	handler: async (ctx, args) => {
		const page = await ctx.db.query(args.table).paginate({
			cursor: args.cursor ?? null,
			numItems: OPERATIONAL_LIMITS.AGGREGATE_BACKFILL_BATCH
		});

		for (const doc of page.page) {
			switch (args.table) {
				case 'reports':
					await aggregateReports.insertIfDoesNotExist(ctx, doc as Doc<'reports'>);
					break;
				case 'apartments':
					await aggregateApartments.insertIfDoesNotExist(ctx, doc as Doc<'apartments'>);
					break;
				case 'bookingEarnings':
					await aggregateHostEarnings.insertIfDoesNotExist(ctx, doc as Doc<'bookingEarnings'>);
					break;
				case 'bookings':
					await aggregateBookings.insertIfDoesNotExist(ctx, doc as Doc<'bookings'>);
					break;
			}
		}

		if (!page.isDone) {
			await ctx.scheduler.runAfter(0, internal.aggregates.backfillAggregates, {
				table: args.table,
				cursor: page.continueCursor
			});
		}
	}
});

/**
 * Wipe one aggregate's stored tree. The first half of the re-backfill ritual the doc
 * comments above kept naming but nothing could actually perform.
 *
 * Needed ONLY when an aggregate's DEFINITION changes (namespace / sort key / sum value):
 * the stored tree was built under the old shape, so entries land in namespaces nobody
 * reads and counts silently drift. Clearing then re-backfilling rebuilds it correctly.
 *
 * ```bash
 * bunx convex run aggregates:clearAggregate '{"table":"reports"}'
 * bunx convex run aggregates:backfillAggregates '{"table":"reports"}'
 * ```
 *
 * Never needed for ordinary schema edits — adding a field the aggregate doesn't read
 * changes nothing about the tree.
 */
export const clearAggregate = internalMutation({
	args: {
		table: v.union(
			v.literal('reports'),
			v.literal('apartments'),
			v.literal('bookingEarnings'),
			v.literal('bookings')
		)
	},
	handler: async (ctx, args) => {
		switch (args.table) {
			case 'reports':
				await aggregateReports.clearAll(ctx);
				break;
			case 'apartments':
				await aggregateApartments.clearAll(ctx);
				break;
			case 'bookingEarnings':
				await aggregateHostEarnings.clearAll(ctx);
				break;
			case 'bookings':
				await aggregateBookings.clearAll(ctx);
				break;
		}
	}
});
