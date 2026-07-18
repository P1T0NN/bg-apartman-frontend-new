// LIBRARIES
import { z } from 'zod';

export const sendContactFormEmailSchema = z.object({
	name: z.string().min(3, 'ValidationMessages.sendContactFormEmailSchema.nameMin'),
	email: z.string().email('ValidationMessages.sendContactFormEmailSchema.invalidEmail'),
	message: z.string().min(10, 'ValidationMessages.sendContactFormEmailSchema.messageMin'),
	// Honeypot — invisible field hidden from real users via CSS. Bots that
	// auto-fill every input will leave a non-empty value and get rejected.
	website: z.literal('').optional()
});

export type SendContactFormEmailSchema = z.infer<typeof sendContactFormEmailSchema>;
