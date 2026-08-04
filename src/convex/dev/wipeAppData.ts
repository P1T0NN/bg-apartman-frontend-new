// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '@/convex/functions';

// UTILS
import { internal } from '@/convex/_generated/api';
import {
	aggregateReports,
	aggregateApartments,
	aggregateHostEarnings,
	aggregateBookings
} from '@/convex/aggregates';

// TYPES
import type { TableNames } from '@/convex/_generated/dataModel';

/**
 * DESTRUCTIVE. Deletes every row from every application table, leaving Better Auth
 * (users / sessions / accounts) untouched.
 *
 * Deliberately NOT deleted:
 *   - the Better Auth component — users, sessions and accounts survive, which is the point;
 *   - the actual uploaded FILES. Only `uploadedFiles` / `uploadedFilesR2` rows go. The R2
 *     objects and Convex storage blobs stay in place and become unreferenced. The orphan
 *     sweeps will offer to remove them on their next run — see the note at the bottom;
 *   - the analytics component's tables. Convex components are sandboxed: app code cannot
 *     reach another component's tables, and this one publishes no reset (its only mutations
 *     are `writeConfiguration`, `writeMetricEvaluationOverride`, `writeTrack`). Clearing it
 *     requires the Convex dashboard. Until then dashboards keep reporting revenue, signups
 *     and booking counts for data that no longer exists.
 *
 * Aggregates are cleared explicitly at the end rather than relied upon to unwind through
 * triggers, so the result is provably empty even if a tree had already drifted.
 *
 * Batched and self-scheduling so a large table cannot blow the per-mutation limits, and
 * guarded by an explicit confirmation phrase so it cannot fire from a stray click or an
 * autocompleted command.
 *
 * ```bash
 * bunx convex run dev/wipeAppData:wipeAppData "{confirm:'DELETE-ALL-APP-DATA'}"
 * ```
 */
const WIPE_TABLES = [
	'auditLogs',
	'uploadedFiles',
	'uploadedFilesR2',
	'apartments',
	'newsletter',
	'reports',
	'bookings',
	'apartmentBlocks',
	'bookingEarnings',
	'hostPayoutAccounts'
] as const satisfies readonly TableNames[];

/** Rows deleted per scheduled step. */
const WIPE_BATCH = 500;

const CONFIRM_PHRASE = 'DELETE-ALL-APP-DATA';

export const wipeAppData = internalMutation({
	args: {
		/** Must be exactly {@link CONFIRM_PHRASE}. Exists so this cannot run by accident. */
		confirm: v.string(),
		/** Internal — which table the sweep is on. Callers omit it. */
		tableIndex: v.optional(v.number()),
		/** Internal — rows removed so far, carried across steps for the final tally. */
		deletedSoFar: v.optional(v.number())
	},
	handler: async (ctx, args) => {
		if (args.confirm !== CONFIRM_PHRASE) {
			throw new Error(
				`[wipeAppData] refused: pass confirm:'${CONFIRM_PHRASE}' if you really mean to delete every application row.`
			);
		}

		const tableIndex = args.tableIndex ?? 0;
		const deletedSoFar = args.deletedSoFar ?? 0;

		// Every table drained — now flatten the aggregate trees. Doing this last means a
		// mid-sweep failure leaves aggregates stale rather than lying about a partial wipe.
		if (tableIndex >= WIPE_TABLES.length) {
			await aggregateReports.clearAll(ctx);
			await aggregateApartments.clearAll(ctx);
			await aggregateHostEarnings.clearAll(ctx);
			await aggregateBookings.clearAll(ctx);

			console.warn('[wipeAppData] COMPLETE — application tables emptied, aggregates cleared', {
				deleted: deletedSoFar,
				keptBetterAuth: true,
				keptUploadedFileObjects: true,
				analyticsComponent: 'NOT cleared — sandboxed, use the Convex dashboard'
			});

			return { done: true, deleted: deletedSoFar };
		}

		const table = WIPE_TABLES[tableIndex];
		const rows = await ctx.db.query(table).take(WIPE_BATCH);
		for (const row of rows) await ctx.db.delete(row._id);

		const deleted = deletedSoFar + rows.length;
		// Short of a full batch means this table is drained — move to the next one.
		const nextIndex = rows.length < WIPE_BATCH ? tableIndex + 1 : tableIndex;

		await ctx.scheduler.runAfter(0, internal.dev.wipeAppData.wipeAppData, {
			confirm: args.confirm,
			tableIndex: nextIndex,
			deletedSoFar: deleted
		});

		return { done: false, table, deletedThisStep: rows.length, deleted };
	}
});
