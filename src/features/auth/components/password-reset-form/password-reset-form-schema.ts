// LIBRARIES
import { z } from 'zod';
import { m } from '@/shared/lib/paraglide/messages';
import { isDeniedPassword } from '@/features/auth/utils/denyPasswordList.js';

const code8Digit = /^\d{8}$/u;

export const passwordResetRequestFormSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, m['ValidationMessages.PasswordResetRequestForm.emailRequired']())
		.email(m['ValidationMessages.PasswordResetRequestForm.invalidEmail']()),
	flow: z.literal('reset')
});

export const passwordResetVerifyFormSchema = z.object({
	code: z
		.string()
		.trim()
		.min(1, m['ValidationMessages.PasswordResetVerifyForm.codeRequired']())
		.regex(code8Digit, m['ValidationMessages.PasswordResetVerifyForm.codeFormat']()),
	newPassword: z
		.string()
		.min(1, m['ValidationMessages.PasswordResetVerifyForm.newPasswordRequired']())
		.min(8, m['ValidationMessages.PasswordResetVerifyForm.newPasswordMinLength']())
		.refine(
			(input) => !isDeniedPassword(input),
			m['ValidationMessages.PasswordResetVerifyForm.passwordTooCommon']()
		),
	email: z.string().trim().email(m['ValidationMessages.PasswordResetVerifyForm.invalidEmail']()),
	flow: z.literal('reset-verification')
});
