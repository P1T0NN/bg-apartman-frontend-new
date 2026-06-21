// LIBRARIES
import { m } from '@/shared/lib/paraglide/messages';
import { toast } from 'svelte-sonner';

// CONFIG
import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/constants';

// UTILS
import { authClient } from '@/features/auth/lib/auth-client';
import {
	passwordResetRequestFormSchema,
	passwordResetVerifyFormSchema
} from './password-reset-form-schema.js';
import { zodIssuesToFieldErrors } from '@/shared/utils/validationUtils.js';
import { rateLimitMessage } from '@/shared/utils/rateLimitMessages';
import { appGoto } from '@/shared/utils/app-navigation';

// TYPES
import type { PasswordResetFormStep, PasswordResetField } from './passwordResetFormTypes.js';
import type { FieldErrors } from '@/shared/types/types';

export function createPasswordResetForm() {
	let step = $state<PasswordResetFormStep>('forgot');
	let busy = $state(false);
	let errorMessage = $state<string | null>(null);
	let fieldErrors = $state<FieldErrors<PasswordResetField>>({});
	let emailDraft = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	async function onForgotSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;

		const form = event.currentTarget as HTMLFormElement;
		const formData = new FormData(form);

		const p = passwordResetRequestFormSchema.safeParse({
			email: String(formData.get('email') ?? ''),
			flow: String(formData.get('flow') ?? '')
		});

		if (!p.success) {
			fieldErrors = zodIssuesToFieldErrors<PasswordResetField>(p.error.issues);
			errorMessage = null;
			return;
		}

		fieldErrors = {};
		busy = true;
		errorMessage = null;

		const normalizedEmail = p.data.email;
		try {
			// Anti-enumeration: ignore the result. The UI always advances to the reset
			// step regardless of whether this email is registered.
			await authClient.emailOtp.requestPasswordReset({ email: normalizedEmail });
		} catch (error) {
			console.error('Password reset: send code (outcome hidden from user):', error);
		} finally {
			emailDraft = normalizedEmail;
			step = { email: normalizedEmail };
			busy = false;
		}
	}

	async function onResetSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;
		if (step === 'forgot') return;

		const form = event.currentTarget as HTMLFormElement;
		const formData = new FormData(form);
		const submittedNewPassword = String(formData.get('newPassword') ?? '');

		const p = passwordResetVerifyFormSchema.safeParse({
			code: String(formData.get('code') ?? '').trim(),
			newPassword: submittedNewPassword,
			email: step.email,
			flow: String(formData.get('flow') ?? '')
		});

		if (!p.success) {
			fieldErrors = zodIssuesToFieldErrors<PasswordResetField>(p.error.issues);
			errorMessage = null;
			return;
		}

		if (submittedNewPassword !== confirmPassword) {
			fieldErrors = {
				confirmPassword: m['ValidationMessages.PasswordResetVerifyForm.passwordsMustMatch']()
			};
			errorMessage = null;
			return;
		}

		fieldErrors = {};
		busy = true;
		errorMessage = null;

		try {
			const { error } = await authClient.emailOtp.resetPassword({
				email: p.data.email,
				otp: p.data.code,
				password: p.data.newPassword
			});
			if (error) {
				console.error('Password reset: verification failed:', error);
				if (/password/i.test(error.message ?? '')) {
					fieldErrors = {
						newPassword: error.message ?? m['EmailVerificationForm.verificationFailed']()
					};
				} else {
					errorMessage = rateLimitMessage(
						error.message,
						m['EmailVerificationForm.verificationFailed']()
					);
				}
				busy = false;
				return;
			}
		} catch (error) {
			console.error('Password reset: verification failed:', error);
			errorMessage = m['EmailVerificationForm.verificationFailed']();
			busy = false;
			return;
		}

		toast.success(m['PasswordResetForm.passwordResetToast']());
		await appGoto(PROTECTED_PAGE_ENDPOINTS.DASHBOARD);
		busy = false;
	}

	function backToForgot() {
		step = 'forgot';
		newPassword = '';
		confirmPassword = '';
		errorMessage = null;
		fieldErrors = {};
	}

	return {
		get step() {
			return step;
		},
		get busy() {
			return busy;
		},
		set busy(v: boolean) {
			busy = v;
		},
		get errorMessage() {
			return errorMessage;
		},
		set errorMessage(v: string | null) {
			errorMessage = v;
		},
		get fieldErrors() {
			return fieldErrors;
		},
		get emailDraft() {
			return emailDraft;
		},
		set emailDraft(v: string) {
			emailDraft = v;
		},
		get newPassword() {
			return newPassword;
		},
		set newPassword(v: string) {
			newPassword = v;
		},
		get confirmPassword() {
			return confirmPassword;
		},
		set confirmPassword(v: string) {
			confirmPassword = v;
		},
		onForgotSubmit,
		onResetSubmit,
		backToForgot
	};
}
