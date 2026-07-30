// LIBRARIES
import { zodToConvexFields } from 'convex-helpers/server/zod4';
import { mutation } from '@/convex/functions';

// SCHEMAS
import { createReportSchema } from '@/shared/features/report/schemas/reportsSchemas';
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

/**
 * File a public bug/idea/feedback report from the `/report` form. Public (no auth).
 *
 * Args are DERIVED from the shared `createReportSchema` — the same object the form
 * validates against — and the handler re-runs it authoritatively. One definition, both
 * sides: the message bounds and the optional-email rule exist in exactly one place.
 * A schema failure means a client bypassed validation, so it collapses to the generic
 * envelope rather than surfacing per-issue copy (the backend holds no display strings).
 */
export const createReport = mutation({
	args: zodToConvexFields(createReportSchema.shape),
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const parsed = createReportSchema.safeParse(args);
		if (!parsed.success) {
			return { success: false, message: { key: 'GenericMessages.REPORT_MESSAGE_REQUIRED' } };
		}

		// `message` is already trimmed by the schema; the email union allows '' for "left blank".
		const { category, message } = parsed.data;

		await ctx.db.insert('reports', {
			category,
			message,
			email: parsed.data.email || undefined,
			// Stamped explicitly from now on so the `by_status` index can find it; readers
			// still normalize `?? 'new'` for rows filed before the field existed (APSD §4).
			status: 'new'
		});

		return { success: true, message: { key: 'GenericMessages.REPORT_SUBMITTED' } };
	}
});
