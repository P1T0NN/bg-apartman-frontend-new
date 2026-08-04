// LIBRARIES
import { z } from 'zod';

// CONFIG
import { AUTH_DATA } from '@/shared/config';

// UTILS
import { isDeniedPassword } from '@/shared/features/auth/utils/denyPasswordList';

/**
 * Auth schemas — login, sign-up, password reset, email verification. Dual-runtime:
 * `safeParse` them from Svelte forms AND Convex functions alike.
 *
 * **No error messages here, deliberately** — the rule lives in the schema, the sentence
 * lives in the catalog (`shared/features/validations/data/backendMessages.ts`), resolved at
 * render. The default zod error map already covers required/email/min/max; the refinements
 * below pass a bare catalog KEY through `params`, because "too common" and "must match"
 * can't be inferred from a zod issue code.
 *
 * Framework-free by contract: plain TS + zod only. `denyPasswordList` sits in `shared/`
 * beside them for the same reason.
 */

/** Refinements that need bespoke copy carry a stable catalog KEY, never a sentence. */
export const AUTH_ISSUE = {
	PASSWORD_TOO_COMMON: 'ValidationMessages.Auth.passwordTooCommon',
	PASSWORDS_MUST_MATCH: 'ValidationMessages.Auth.passwordsMustMatch',
	CODE_FORMAT: 'ValidationMessages.Auth.codeFormat'
} as const;

/** Matches the emailed OTP format. */
const otpPattern = new RegExp(`^[0-9]{${AUTH_DATA.OTP_LENGTH}}$`, 'u');

/**
 * `code` field shared by both OTP flows. No message on the regex: zod's `.regex()` takes no
 * `params`, and the field is named `code` — the default map's field-path layer already
 * routes it to `ValidationMessages.Field.code` with the digit count interpolated.
 */
const otpCode = z.string().trim().min(1).regex(otpPattern);

/**
 * `.pipe(z.email())` (zod v4's non-deprecated form) runs AFTER trim + min(1), so an empty
 * field reads "required" — not "invalid email" — and whitespace never fails the format.
 */
const emailField = z.string().trim().min(1).pipe(z.email());

const passwordField = z
	.string()
	.min(1)
	.min(AUTH_DATA.PASSWORD_MIN_LENGTH)
	.refine((input) => !isDeniedPassword(input), {
		params: { key: AUTH_ISSUE.PASSWORD_TOO_COMMON }
	});

// ─── Sign in / sign up ────────────────────────────────────────────────────────

export const loginFormSchema = z.object({
	email: emailField,
	// No deny-list on sign-in: the password either matches the stored hash or it doesn't,
	// and rejecting a weak-but-correct one just locks an existing user out.
	password: z.string().min(1).min(AUTH_DATA.PASSWORD_MIN_LENGTH),
	flow: z.literal('signIn')
});

export const signUpFormSchema = z
	.object({
		name: z.string().trim().min(1),
		email: emailField,
		password: passwordField,
		confirmPassword: z.string().min(1),
		flow: z.literal('signUp')
	})
	// The match rule lives IN the schema, not in a form model — one parse validates the
	// whole contract on either runtime.
	.refine((data) => data.password === data.confirmPassword, {
		path: ['confirmPassword'],
		params: { key: AUTH_ISSUE.PASSWORDS_MUST_MATCH }
	});

// ─── Password reset ───────────────────────────────────────────────────────────

export const passwordResetRequestFormSchema = z.object({
	email: emailField,
	flow: z.literal('reset')
});

export const passwordResetVerifyFormSchema = z
	.object({
		code: otpCode,
		newPassword: passwordField,
		confirmPassword: z.string().min(1),
		email: emailField,
		flow: z.literal('reset-verification')
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		path: ['confirmPassword'],
		params: { key: AUTH_ISSUE.PASSWORDS_MUST_MATCH }
	});

// ─── Email verification ───────────────────────────────────────────────────────

export const emailVerificationFormSchema = z.object({
	code: otpCode,
	email: emailField,
	flow: z.literal('email-verification')
});
