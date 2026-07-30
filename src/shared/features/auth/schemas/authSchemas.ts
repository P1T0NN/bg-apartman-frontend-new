// LIBRARIES
import { z } from 'zod';

// UTILS
import { isDeniedPassword } from '@/shared/features/auth/utils/denyPasswordList';

/**
 * Auth schemas — login, sign-up, password reset, email verification.
 *
 * **No error messages here, deliberately** — the rule lives in the schema, the sentence
 * lives in the client-only error map (`src/utils/zodMessages.ts`). The two
 * password `.refine`s pass a KEY the map recognises, because "too common" can't be
 * inferred from a zod issue code.
 *
 * Framework-free by contract: plain TS + zod only. `denyPasswordList` sits in `shared/`
 * beside them for the same reason.
 */

/** Refinements that need bespoke copy carry a stable KEY, never a sentence. */
export const AUTH_ISSUE = {
	PASSWORD_TOO_COMMON: 'auth.passwordTooCommon'
} as const;

const code8Digit = /^\d{8}$/u;

// ─── Sign in / sign up ────────────────────────────────────────────────────────

export const loginFormSchema = z.object({
	email: z.string().trim().pipe(z.email()),
	password: z.string().min(8),
	flow: z.literal('signIn')
});

export const signUpFormSchema = z.object({
	name: z.string().trim().min(1),
	email: z.string().trim().pipe(z.email()),
	password: z
		.string()
		.min(8)
		.refine((input) => !isDeniedPassword(input), { params: { key: AUTH_ISSUE.PASSWORD_TOO_COMMON } }),
	confirmPassword: z.string().min(1),
	flow: z.literal('signUp')
});

// ─── Password reset ───────────────────────────────────────────────────────────

export const passwordResetRequestFormSchema = z.object({
	email: z.string().trim().pipe(z.email()),
	flow: z.literal('reset')
});

export const passwordResetVerifyFormSchema = z.object({
	code: z.string().trim().min(1).regex(code8Digit),
	newPassword: z
		.string()
		.min(8)
		.refine((input) => !isDeniedPassword(input), { params: { key: AUTH_ISSUE.PASSWORD_TOO_COMMON } }),
	email: z.string().trim().pipe(z.email()),
	flow: z.literal('reset-verification')
});

// ─── Email verification ───────────────────────────────────────────────────────

export const emailVerificationFormSchema = z.object({
	code: z.string().trim().min(1).regex(code8Digit),
	email: z.string().trim().pipe(z.email()),
	flow: z.literal('email-verification')
});
