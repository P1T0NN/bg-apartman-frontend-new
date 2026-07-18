// LIBRARIES
import { z } from 'zod';

export const REPORT_CATEGORIES = ['bug', 'idea', 'other'] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

const MAX_MESSAGE_LENGTH = 5000;

/**
 * Client-side validation for the public `/report` form. Mirrors the server-side gate in
 * `createReport` (required bounded message, optional email); the category is constrained by the
 * picker UI but the schema is the authoritative gate. Messages are Paraglide keys, resolved at
 * display time (see zodIssuesToFieldErrors) so the schema stays pure and shareable.
 */
export const createReportSchema = z.object({
	category: z.enum(REPORT_CATEGORIES),
	message: z
		.string()
		.trim()
		.min(1, 'ValidationMessages.createReportSchema.messageRequired')
		.max(MAX_MESSAGE_LENGTH, 'ValidationMessages.createReportSchema.messageMax'),
	// Optional: empty string (left blank) or a valid email if they want a follow-up.
	email: z.union([
		z.literal(''),
		z.string().trim().email('ValidationMessages.createReportSchema.emailInvalid')
	])
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
