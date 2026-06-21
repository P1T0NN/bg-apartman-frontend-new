// LIBRARIES
import { z } from 'zod';
import { m } from '@/shared/lib/paraglide/messages';

export const loginFormSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, m['ValidationMessages.LoginForm.emailRequired']())
		.email(m['ValidationMessages.LoginForm.invalidEmail']()),
	password: z
		.string()
		.min(1, m['ValidationMessages.LoginForm.passwordRequired']())
		.min(8, m['ValidationMessages.LoginForm.passwordMinLength']()),
	flow: z.literal('signIn')
});
