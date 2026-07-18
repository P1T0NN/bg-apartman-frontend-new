// LIBRARIES
import { z } from 'zod';
import { isDeniedPassword } from '@/features/auth/utils/denyPasswordList.js';

const code8Digit = /^\d{8}$/u;

export const passwordResetRequestFormSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, 'ValidationMessages.passwordResetRequestFormSchema.emailRequired')
		.email('ValidationMessages.passwordResetRequestFormSchema.invalidEmail'),
	flow: z.literal('reset')
});

export const passwordResetVerifyFormSchema = z.object({
	code: z
		.string()
		.trim()
		.min(1, 'ValidationMessages.passwordResetVerifyFormSchema.codeRequired')
		.regex(code8Digit, 'ValidationMessages.passwordResetVerifyFormSchema.codeFormat'),
	newPassword: z
		.string()
		.min(1, 'ValidationMessages.passwordResetVerifyFormSchema.newPasswordRequired')
		.min(8, 'ValidationMessages.passwordResetVerifyFormSchema.newPasswordMinLength')
		.refine(
			(input) => !isDeniedPassword(input),
			'ValidationMessages.passwordResetVerifyFormSchema.passwordTooCommon'
		),
	email: z.string().trim().email('ValidationMessages.passwordResetVerifyFormSchema.invalidEmail'),
	flow: z.literal('reset-verification')
});
