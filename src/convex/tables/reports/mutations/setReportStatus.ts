// LIBRARIES
import { v } from 'convex/values';

// UTILS
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';

// SCHEMAS
import { reportStatus } from '../schemas/reportsSchemas';
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

/**
 * Flip a report between `new` and `resolved` (AdminPagesSystemDesign.md §4).
 *
 * Reversible by design, which is why the UI offers undo instead of a confirm dialog:
 * a dialog per click is real cognitive load for an action that costs one more click to
 * take back.
 *
 * Runs through `adminMutation` (built on the trigger-wrapped constructors), so the
 * `aggregateReports` namespace — and therefore the sidebar badge — moves with the write
 * rather than drifting (GeneralSystemDesignRule.md § table counts).
 */
export const setReportStatus = adminMutation('setReportStatus')({
	args: {
		id: v.id('reports'),
		status: reportStatus
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const report = await ctx.db.get(args.id);
		if (!report) return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };

		// Legacy rows read as `new`; treat a no-op flip as success so undo/double-click
		// never surfaces an error.
		if ((report.status ?? 'new') !== args.status) {
			await ctx.db.patch(args.id, { status: args.status });
		}

		return {
			success: true,
			message: {
				key:
					args.status === 'resolved'
						? 'GenericMessages.REPORT_RESOLVED'
						: 'GenericMessages.REPORT_REOPENED'
			}
		};
	}
});
