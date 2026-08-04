// LIBRARIES
import { z } from 'zod';

/**
 * Newsletter schemas — validated on the client before submit and re-run authoritatively in
 * `subscribeToNewsletters`.
 *
 * **No error messages here, deliberately** — the rule lives in the schema, the sentence in
 * the client-only error map (`shared/features/validations/data/backendMessages.ts`).
 */

export const newsletterSchema = z.object({
	email: z.string().trim().pipe(z.email())
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
