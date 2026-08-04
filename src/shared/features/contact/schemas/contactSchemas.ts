// LIBRARIES
import { z } from 'zod';

/**
 * Contact schemas — validated on the client before submit and re-run authoritatively in
 * the `sendContactFormEmail` remote function.
 *
 * **No error messages here, deliberately** — the rule lives in the schema, the sentence in
 * the client-only error map (`shared/features/validations/data/backendMessages.ts`).
 */

export const sendContactFormEmailSchema = z.object({
	name: z.string().min(3),
	email: z.email(),
	message: z.string().min(10),
	// Honeypot — invisible field hidden from real users via CSS. Bots that
	// auto-fill every input will leave a non-empty value and get rejected.
	website: z.literal('').optional()
});

export type SendContactFormEmailSchema = z.infer<typeof sendContactFormEmailSchema>;
