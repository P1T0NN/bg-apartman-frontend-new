// LIBRARIES
import { z } from 'zod';

/**
 * Validates the newsletter subscribe form. Messages are Paraglide keys, resolved at display
 * time (see zodIssuesToFieldErrors) so the schema stays pure and shareable.
 */
export const newsletterSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, 'ValidationMessages.newsletterSchema.emailRequired')
		.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'ValidationMessages.newsletterSchema.invalidEmail')
});
