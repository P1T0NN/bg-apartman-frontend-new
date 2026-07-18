// LIBRARIES
import { z } from 'zod';

export const loginFormSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, 'ValidationMessages.loginFormSchema.emailRequired')
		.email('ValidationMessages.loginFormSchema.invalidEmail'),
	password: z
		.string()
		.min(1, 'ValidationMessages.loginFormSchema.passwordRequired')
		.min(8, 'ValidationMessages.loginFormSchema.passwordMinLength'),
	flow: z.literal('signIn')
});
