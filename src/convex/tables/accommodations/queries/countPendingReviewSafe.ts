// LIBRARIES
import { query } from '@/convex/_generated/server';

// UTILS
import { requireAdmin } from '@/convex/auth/middleware/authMiddleware';

/**
 * Sidebar badge for `/admin/accommodations`: how many accommodations await review.
 * Bounded count — reads at most 51 rows and reports `capped` so the UI renders
 * "50+" instead of ever `.collect()`-ing the table to count it.
 */
export const countPendingReviewSafe = query({
	handler: async (ctx): Promise<{ count: number; capped: boolean }> => {
		await requireAdmin(ctx);

		const rows = await ctx.db
			.query('apartments')
			.withIndex('by_status', (q) => q.eq('status', 'pending_review'))
			.take(51);

		return { count: Math.min(rows.length, 50), capped: rows.length > 50 };
	}
});
