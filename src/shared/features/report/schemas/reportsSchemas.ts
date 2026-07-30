// LIBRARIES
import { z } from 'zod';

// CONFIG
import { CONTENT_LIMITS } from '@/shared/config';

/**
 * Report schemas — the single source of truth, shared by BOTH sides: `createReport`
 * derives its args from `createReportSchema` and re-runs it authoritatively; the public
 * `/report` form validates against the same object.
 *
 * **No error messages here, deliberately** — the rule lives in the schema, the sentence in
 * the client-only error map (`src/utils/zodMessages.ts`).
 */

export const REPORT_CATEGORIES = ['bug', 'idea', 'other'] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const createReportSchema = z.object({
	category: z.enum(REPORT_CATEGORIES),
	message: z.string().trim().min(1).max(CONTENT_LIMITS.REPORT_MESSAGE_MAX),
	// Optional: empty string (left blank) or a valid email if they want a follow-up.
	email: z.union([z.literal(''), z.string().trim().pipe(z.email())])
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
