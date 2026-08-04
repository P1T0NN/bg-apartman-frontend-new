// UTILS
import { internalMutation } from '@/convex/_generated/server';

import { OPERATIONAL_LIMITS } from '@/shared/config';

/**
 * Retention sweep. Deletes rows whose stamped `retentionUntil` has passed.
 *
 * Retention is per-action, so "expired?" is not a function of age alone — which is why the
 * deadline is resolved once at write time (`auditLogInternal`) rather than re-derived per
 * row here. The sweep is then a single range read over exactly the expired set: the daily
 * cost is proportional to what there is to delete, not to how large the table has grown.
 *
 * The `.gte(0)` end excludes rows with no deadline — `Infinity`-retention actions, and any
 * legacy row written before the column existed. Those are kept, never wrongly purged.
 * ⚠️ If this deploys onto a table with real history, backfill `retentionUntil` on the
 * existing rows or they will be retained forever.
 *
 * Idempotent and safe on any cadence. Wire it up from the root `crons.ts`:
 *   crons.daily('purge stale audit logs', { hourUTC: 4, minuteUTC: 0 },
 *     internal.tables.auditLog.crons.auditLogCron.purgeStaleAuditLogs, {});
 */
export const purgeStaleAuditLogs = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();

		const expired = await ctx.db
			.query('auditLogs')
			.withIndex('by_retention_until', (q) => q.gte('retentionUntil', 0).lte('retentionUntil', now))
			.take(OPERATIONAL_LIMITS.AUDIT_LOG_MAX_DELETES_PER_RUN);

		for (const row of expired) await ctx.db.delete(row._id);

		// Deadline-ordered, so the cap drains oldest-expired first and the remainder is
		// picked up next run rather than starved.
		return {
			deleted: expired.length,
			capped: expired.length === OPERATIONAL_LIMITS.AUDIT_LOG_MAX_DELETES_PER_RUN
		};
	}
});
