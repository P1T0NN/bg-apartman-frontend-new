// LIBRARIES
import { z } from 'zod';

const code8Digit = /^\d{8}$/u;

export const emailVerificationFormSchema = z.object({
	code: z
		.string()
		.trim()
		.min(1, 'ValidationMessages.emailVerificationFormSchema.codeRequired')
		.regex(code8Digit, 'ValidationMessages.emailVerificationFormSchema.codeFormat'),
	email: z.string().trim().email('ValidationMessages.emailVerificationFormSchema.invalidEmail'),
	flow: z.literal('email-verification')
});
