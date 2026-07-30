// LIBRARIES
import { query } from '@/convex/_generated/server';

// UTILS
import { requireAdmin } from '@/convex/auth/middleware/authMiddleware';
import { aggregateApartments, aggregateReports } from '@/convex/aggregates';

/**
 * The two sidebar badges (AdminPagesSystemDesign.md §1) — listings awaiting review and
 * unread reports — in one query.
 *
 * **Badges are the wayfinding system**: a non-developer admin should never open a page to
 * learn whether it needs them. Exactly two, because exactly two streams pile up work a
 * human must drain. Zero means done, and the UI hides the badge entirely.
 *
 * Both are NOW-questions about current rows, so both are `@convex-dev/aggregate` counts —
 * O(log n), never a scan (GeneralSystemDesignRule.md § table counts). This replaced
 * `countPendingReviewSafe`, which predated the aggregates and read up to 51 rows to report
 * a capped "50+".
 *
 * Realtime verdict: **subscription**, subscribed in the admin layout. Hosts submit
 * listings and the public files reports while the admin works — the badge must move
 * without them acting. This does not break the "no layout-level feature fetches" rule: the
 * layout RENDERS these numbers as nav chrome, it doesn't mirror them into pages.
 */
export const fetchAdminSidebarBadgesSafe = query({
	args: {},
	handler: async (ctx): Promise<{ pendingReview: number; newReports: number }> => {
		await requireAdmin(ctx);

		const [pendingReview, newReports] = await Promise.all([
			aggregateApartments.count(ctx, { namespace: 'pending_review', bounds: {} }),
			// Namespace normalizes `undefined → 'new'`, so legacy rows count correctly.
			aggregateReports.count(ctx, { namespace: 'new', bounds: {} })
		]);

		return { pendingReview, newReports };
	}
});
