// LIBRARIES
import { z } from 'zod';
import { isDeniedPassword } from '@/features/auth/utils/denyPasswordList.js';

export const signUpFormSchema = z.object({
	name: z.string().trim().min(1, 'ValidationMessages.signUpFormSchema.nameRequired'),
	email: z
		.string()
		.trim()
		.min(1, 'ValidationMessages.signUpFormSchema.emailRequired')
		.email('ValidationMessages.signUpFormSchema.invalidEmail'),
	password: z
		.string()
		.min(1, 'ValidationMessages.signUpFormSchema.passwordRequired')
		.min(8, 'ValidationMessages.signUpFormSchema.passwordMinLength')
		.refine(
			(input) => !isDeniedPassword(input),
			'ValidationMessages.signUpFormSchema.passwordTooCommon'
		),
	confirmPassword: z.string().min(1, 'ValidationMessages.signUpFormSchema.confirmPasswordRequired'),
	flow: z.literal('signUp')
});
