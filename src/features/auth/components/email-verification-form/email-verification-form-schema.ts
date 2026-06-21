// LIBRARIES
import { z } from 'zod';
import { m } from '@/shared/lib/paraglide/messages';

const code8Digit = /^\d{8}$/u;

export const emailVerificationFormSchema = z.object({
	code: z
		.string()
		.trim()
		.min(1, m['ValidationMessages.EmailVerificationForm.codeRequired']())
		.regex(code8Digit, m['ValidationMessages.EmailVerificationForm.codeFormat']()),
	email: z.string().trim().email(m['ValidationMessages.EmailVerificationForm.invalidEmail']()),
	flow: z.literal('email-verification')
});
