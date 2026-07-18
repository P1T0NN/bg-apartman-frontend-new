// LIBRARIES
import { v } from 'convex/values';
import { mutation } from '@/convex/_generated/server';

// SCHEMAS
import { reportCategory } from '@/convex/tables/reports/schemas/reportsSchemas';
import { mutationResult } from '@/convex/schemas/schemas';

/**
 * File a public bug/idea/feedback report from the `/report` form. Public (no auth).
 *
 * The message is required and stored trimmed; email is optional and only kept when the
 * reporter left one (so we can follow up). Category is constrained by `reportCategory`.
 */
export const createReport = mutation({
	args: {
		category: reportCategory,
		message: v.string(),
		email: v.optional(v.string())
	},
	returns: mutationResult,
	handler: async (ctx, args) => {
		const message = args.message.trim();
		if (!message) {
			return { success: false, message: { key: 'GenericMessages.REPORT_MESSAGE_REQUIRED' } };
		}

		const email = args.email?.trim();

		await ctx.db.insert('reports', {
			category: args.category,
			message,
			email: email || undefined
		});

		return { success: true, message: { key: 'GenericMessages.REPORT_SUBMITTED' } };
	}
});
