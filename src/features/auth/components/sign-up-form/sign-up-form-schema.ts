// LIBRARIES
import { z } from 'zod';
import { m } from '@/shared/lib/paraglide/messages';
import { isDeniedPassword } from '@/features/auth/utils/denyPasswordList.js';

export const signUpFormSchema = z.object({
	name: z.string().trim().min(1, m['ValidationMessages.SignUpForm.nameRequired']()),
	email: z
		.string()
		.trim()
		.min(1, m['ValidationMessages.SignUpForm.emailRequired']())
		.email(m['ValidationMessages.SignUpForm.invalidEmail']()),
	password: z
		.string()
		.min(1, m['ValidationMessages.SignUpForm.passwordRequired']())
		.min(8, m['ValidationMessages.SignUpForm.passwordMinLength']())
		.refine(
			(input) => !isDeniedPassword(input),
			m['ValidationMessages.SignUpForm.passwordTooCommon']()
		),
	confirmPassword: z.string().min(1, m['ValidationMessages.SignUpForm.confirmPasswordRequired']()),
	flow: z.literal('signUp')
});
