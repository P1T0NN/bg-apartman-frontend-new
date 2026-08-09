// LIBRARIES
import { defineCounters } from '@piton-/analytics-convex/counters';
import { customCtx, customMutation } from 'convex-helpers/server/customFunctions';
import { v } from 'convex/values';

// UTILS
import { OPERATIONAL_LIMITS } from '@/shared/config';
import { components, internal } from '@/convex/_generated/api';
import {
	mutation as rawMutation,
	internalMutation as rawInternalMutation
} from '@/convex/_generated/server';

// TYPES
import type { DataModel } from '@/convex/_generated/dataModel';

/**
 * Exact, live table counters + the trigger-wrapped mutation constructors that keep them in
 * sync — declared once via `defineCounters` from `@piton-/analytics-convex/counters`, which
 * owns `@convex-dev/aggregate` as an optional peer so this app no longer depends on it
 * directly.
 *
 * Scope per GeneralSystemDesignRule.md § table counts: counters answer "how many rows are X
 * right now". Event analytics — funnels, revenue, time series, "how many happened today" —
 * stay in `@piton-/analytics-convex` metrics.
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
export const { counters, wrapDB } = defineCounters<DataModel>()((counter) => ({
	/**
	 * Reports by inbox status — `count(ctx, 'new')` is the sidebar badge and the dashboard's
	 * "needs attention" number (AdminPagesSystemDesign.md §1/§4).
	 *
	 * The namespace normalizes `undefined → 'new'`, which is what lets the schema field stay
	 * optional and legacy rows stay unmigrated. The null sort key is deliberate: nothing
	 * reads a range within a status, and keeping it preserves the existing tree.
	 */
	reports: counter('reports', {
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
	apartments: counter('apartments', {
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
	hostEarnings: counter('bookingEarnings', {
		component: components.aggregateHostEarnings,
		namespace: (doc) => doc.hostId,
		sortKey: (doc) => doc.status,
		sumValue: (doc) => doc.net
	}),
	/**
	 * Bookings by status, keyed by check-in date (ISO string, so bounds compare the way the
	 * `by_*_status_checkin` indexes already do). Powers the admin dashboard's pulse row
	 * (AdminDashboardPageSystemDesign.md §3):
	 * - check-ins today: bounded count on `confirmed`, `[today, today]`
	 * - pending open:    `counters.bookings.count(ctx, 'pending')`
	 */
	bookings: counter('bookings', {
		component: components.aggregateBookings,
		namespace: (doc) => doc.status,
		sortKey: (doc) => doc.checkInDate
	})
}));

// Composed with `wrapDB` rather than taking `defineCounters`' own mutation constructors:
// those are built on Convex's generic builders, so `ctx.db` would lose this app's DataModel
// typing everywhere. Composing is the documented path for apps that already wrap mutations.
export const mutation = customMutation(rawMutation, customCtx(wrapDB));
export const internalMutation = customMutation(rawInternalMutation, customCtx(wrapDB));

const counterName = v.union(
	v.literal('reports'),
	v.literal('apartments'),
	v.literal('hostEarnings'),
	v.literal('bookings')
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
 * bunx convex run functions:backfillCounters "{counter:'bookings'}"
 * ```
 *
 * Also re-run for a counter whose DEFINITION changed (namespace / sort key / sum), after
 * clearing it with {@link clearCounter} — a changed definition invalidates the stored tree.
 *
 * ⚠️ **ALWAYS {@link clearCounter} first when RE-PROVISIONING a component that existed
 * before.** A Convex component keeps its stored data across being removed from
 * `convex.config.ts` and added back, so a backfill onto a resurrected tree ADDS to whatever
 * was already in it and every count reads high. This bit the bookings counter on dev
 * (2026-07-31): it shipped early, was removed unused, and when re-added for the admin
 * dashboard the rows that existed in its first life were counted twice — the dashboard
 * reported 2 pending requests against 1 real one. The backfill itself is genuinely
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
