// LIBRARIES
import { Aggregate, TableAggregate } from '@convex-dev/aggregate';
import { customCtx, customMutation } from 'convex-helpers/server/customFunctions';
import { Triggers } from 'convex-helpers/server/triggers';
import { v } from 'convex/values';

// UTILS
import { OPERATIONAL_LIMITS } from '@/shared/config';
import { components, internal } from '@/convex/_generated/api';
import {
	mutation as rawMutation,
	internalMutation as rawInternalMutation
} from '@/convex/_generated/server';

// TYPES
import type { ComponentApi } from '@convex-dev/aggregate/_generated/component.js';
import type { Key } from '@convex-dev/aggregate';
import type { DocumentByName } from 'convex/server';
import type { QueryCtx, MutationCtx } from '@/convex/_generated/server';
import type { DataModel } from '@/convex/_generated/dataModel';

/**
 * Exact, live table counters + the trigger-wrapped mutation constructors that keep them in
 * sync — built directly on `@convex-dev/aggregate` now (the `@piton-/analytics-convex`
 * `defineCounters` wrapper was dropped).
 *
 * Scope per GeneralSystemDesignRule.md § table counts: counters answer "how many rows are X
 * right now". Event analytics — time series, "how many happened today" — stay in
 * `@vllnt/convex-analytics` (`./analytics/analytics.ts`).
 *
 * RULE: import `mutation` / `internalMutation` from THIS file, not from `_generated/server`.
 * A write to a followed table through the raw constructors bypasses the triggers and
 * silently drifts the counts. The auth wrappers (`authMutation`, `adminMutation`, …) already
 * build on these, so endpoints using them are covered for free. Queries and actions are
 * unaffected — keep importing those from `_generated/server`.
 *
 * Reads are `counters.x.count(ctx, namespace)` — never `.collect().length`. That covers a
 * whole namespace; a bounded read (a key range inside one namespace) drops to the raw
 * `counters.x.aggregate.count(ctx, { namespace, bounds })`.
 *
 * ⚠️ Namespace / sort key / sum value are the tree's SHAPE. Changing one invalidates the
 * stored tree — see {@link clearCounter} + {@link backfillCounters}.
 */
const triggers = new Triggers<DataModel>();
export const wrapDB = triggers.wrapDB;

/**
 * Hand-rolled `defineCounter`: one `TableAggregate` per counter, kept in sync by a table
 * trigger. `namespace` is the outer grouping (read as `count/sum(ctx, namespace)`); `sortKey`
 * is the inner sort key (read as a `bounds` range). `sumValue` turns the counter into a sum
 * over a numeric field instead of a row count.
 *
 * `namespace` is typed as `string` rather than each table's status union: the readers pass
 * string literals and the aggregate's tree stores a plain Convex value, so the precise union
 * buys nothing here. `K` is inferred from `sortKey`'s return type.
 */
function defineCounter<T extends keyof DataModel, K extends Key>(spec: {
	table: T;
	component: ComponentApi;
	namespace: (doc: DocumentByName<DataModel, T>) => string;
	sortKey: (doc: DocumentByName<DataModel, T>) => K;
	sumValue?: (doc: DocumentByName<DataModel, T>) => number;
}) {
	const aggregate = new TableAggregate<{
		Key: K;
		DataModel: DataModel;
		TableName: T;
		Namespace: string;
	}>(spec.component, {
		sortKey: spec.sortKey,
		namespace: spec.namespace,
		...(spec.sumValue ? { sumValue: spec.sumValue } : {})
	});

	triggers.register(spec.table, aggregate.trigger());

	return {
		count: (ctx: QueryCtx, namespace: string) => aggregate.count(ctx, { namespace }),
		sum: (ctx: QueryCtx, namespace: string) => aggregate.sum(ctx, { namespace }),
		backfill: async (ctx: MutationCtx, opts: { cursor?: string | null; pageSize: number }) => {
			const { page, continueCursor, isDone } = await ctx.db
				.query(spec.table)
				.paginate({ cursor: opts.cursor ?? null, numItems: opts.pageSize });

			for (const doc of page) {
				await aggregate.insertIfDoesNotExist(ctx, doc);
			}

			return { cursor: continueCursor, isDone, processed: page.length };
		},
		aggregate
	};
}

export const counters = {
	/**
	 * Reports by inbox status — `count(ctx, 'new')` is the sidebar badge and the dashboard's
	 * "needs attention" number (AdminPagesSystemDesign.md §1/§4).
	 *
	 * The namespace normalizes `undefined → 'new'`, which is what lets the schema field stay
	 * optional and legacy rows stay unmigrated. The null sort key is deliberate: nothing
	 * reads a range within a status, and keeping it preserves the existing tree.
	 */
	reports: defineCounter({
		table: 'reports',
		component: components.aggregateReports,
		namespace: (doc) => doc.status ?? 'new',
		sortKey: () => null
	}),
	/**
	 * Apartments by status, keyed by host id. The key exists so ONE tree serves both readers
	 * instead of a second component duplicating every write:
	 * - platform-wide (admin sidebar): `counters.apartments.count(ctx, 'pending_review')`
	 * - per host (host dashboard):     same namespace, bounds clamped to `[hostId, hostId]`
	 *
	 * Per-host counts matter because hosts here are not one-apartment individuals — a
	 * sizeable minority own 100+ listings, so `.collect()`-and-count on the host dashboard
	 * would pull hundreds of fat documents (photos, amenities, description) to produce three
	 * integers.
	 */
	apartments: defineCounter({
		table: 'apartments',
		component: components.aggregateApartments,
		namespace: (doc) => doc.status,
		sortKey: (doc) => doc.hostId
	}),
	/**
	 * Host earnings by host, keyed by earning status, summing `net`.
	 *
	 * The stage-3 payout card's "€X waiting" is the held balance: a `sum` bounded to the
	 * `held` key — a NOW-question about current rows (PaymentsSystemDesign.md §5). Earnings
	 * *history* and trends stay analytics events.
	 */
	hostEarnings: defineCounter({
		table: 'bookingEarnings',
		component: components.aggregateHostEarnings,
		namespace: (doc) => doc.hostId,
		sortKey: (doc) => doc.status,
		sumValue: (doc) => doc.net
	}),
	/**
	 * Registered users — exact count, read O(log n) via `count(ctx)`. NOT a `defineCounter`
	 * like the others: the better-auth `user` table lives inside the better-auth component,
	 * out of this app's table-trigger view, so nothing here can follow it. Instead the
	 * better-auth `triggers.user.onCreate/onDelete` callbacks (which DO run in app context)
	 * maintain this tree — see `adjustUserCount` in `src/convex/auth/auth.ts`. This replaces
	 * the old capped `.take()` scan (`countUsers`), which re-ran a full table read on every
	 * platform-wide dashboard invalidation.
	 */
	users: new Aggregate<null, string>(components.aggregateUsers)
};

// Composed with `wrapDB` so `ctx.db` keeps this app's DataModel typing everywhere.
export const mutation = customMutation(rawMutation, customCtx(wrapDB));
export const internalMutation = customMutation(rawInternalMutation, customCtx(wrapDB));

const counterName = v.union(
	v.literal('reports'),
	v.literal('apartments'),
	v.literal('hostEarnings')
);

/**
 * One-time backfill of pre-existing rows into a counter's tree. Idempotent
 * (`insertIfDoesNotExist`), paginated, self-scheduling until the table is drained.
 *
 * Run once per counter after the component ships (and never again — triggers own it from
 * then on):
 * ```bash
 * bunx convex run functions:backfillCounters "{counter:'reports'}"
 * bunx convex run functions:backfillCounters "{counter:'apartments'}"
 * bunx convex run functions:backfillCounters "{counter:'hostEarnings'}"
 * ```
 *
 * Also re-run for a counter whose DEFINITION changed (namespace / sort key / sum), after
 * clearing it with {@link clearCounter} — a changed definition invalidates the stored tree.
 *
 * ⚠️ **ALWAYS {@link clearCounter} first when RE-PROVISIONING a counter that existed
 * before.** A Convex component keeps its stored data across being removed from
 * `convex.config.ts` and added back, so a backfill onto a resurrected tree ADDS to whatever
 * was already in it and every count reads high. The backfill itself is genuinely
 * idempotent (verified: re-running it changes nothing); the duplication comes from the
 * pre-existing tree, which only {@link clearCounter} removes.
 */
export const backfillCounters = internalMutation({
	args: {
		counter: counterName,
		cursor: v.optional(v.union(v.string(), v.null()))
	},
	handler: async (ctx, args) => {
		const result = await counters[args.counter].backfill(ctx, {
			cursor: args.cursor ?? null,
			pageSize: OPERATIONAL_LIMITS.AGGREGATE_BACKFILL_BATCH
		});

		if (!result.isDone) {
			await ctx.scheduler.runAfter(0, internal.functions.backfillCounters, {
				counter: args.counter,
				cursor: result.cursor
			});
		}

		return result;
	}
});

/**
 * Wipe one counter's stored tree. The first half of the re-backfill ritual.
 *
 * Needed ONLY when a counter's DEFINITION changes (namespace / sort key / sum value): the
 * stored tree was built under the old shape, so entries land in namespaces nobody reads and
 * counts silently drift. Clearing then re-backfilling rebuilds it correctly.
 *
 * ```bash
 * bunx convex run functions:clearCounter "{counter:'reports'}"
 * bunx convex run functions:backfillCounters "{counter:'reports'}"
 * ```
 *
 * Never needed for ordinary schema edits — adding a field the counter doesn't read changes
 * nothing about the tree.
 */
export const clearCounter = internalMutation({
	args: { counter: counterName },
	handler: async (ctx, args) => {
		await counters[args.counter].aggregate.clearAll(ctx);
	}
});

/**
 * Bump `counters.users` from the better-auth user triggers (`src/convex/auth/auth.ts`).
 * Scheduled, never awaited, so a signup can never fail on a counter write; the
 * `_insertIfDoesNotExist` / `_deleteIfExists` calls make the scheduled write idempotent.
 */
export const adjustUserCount = internalMutation({
	args: { id: v.string(), delta: v.number() },
	handler: async (ctx, args) => {
		if (args.delta > 0) {
			await counters.users._insertIfDoesNotExist(ctx, undefined, null, args.id);
		} else {
			await counters.users._deleteIfExists(ctx, undefined, null, args.id);
		}
	}
});

/**
 * One-time backfill of pre-existing users into `counters.users`, self-scheduling until done.
 * Run once when this ships — the tree starts empty and the live triggers only cover new
 * signups:
 * ```bash
 * bunx convex run functions:backfillUserCount
 * ```
 * Reads the BA component's own `user` table via `listUsersPaginated` (the app's `ctx.db`
 * can't see it) and inserts each `_id` as a tree item.
 */
export const backfillUserCount = internalMutation({
	args: { cursor: v.optional(v.union(v.string(), v.null())) },
	handler: async (ctx, args) => {
		const res = await ctx.runQuery(components.betterAuth.userQueries.listUsersPaginated, {
			paginationOpts: {
				numItems: OPERATIONAL_LIMITS.AGGREGATE_BACKFILL_BATCH,
				cursor: args.cursor ?? null
			}
		});

		for (const user of res.page) {
			await counters.users._insertIfDoesNotExist(ctx, undefined, null, user._id);
		}

		if (!res.isDone) {
			await ctx.scheduler.runAfter(0, internal.functions.backfillUserCount, {
				cursor: res.continueCursor
			});
		}

		return { processed: res.page.length, isDone: res.isDone };
	}
});
