// LIBRARIES
import { m } from '@/shared/lib/paraglide/messages';
import { toast } from 'svelte-sonner';

// CONFIG
import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints';

// UTILS
import { authClient } from '@/features/auth/lib/auth-client';
import { signUpFormSchema } from './sign-up-form-schema.js';
import { zodIssuesToFieldErrors } from '@/shared/utils/validationUtils.js';
import { rateLimitMessage } from '@/utils/rateLimitMessages';
import { appGoto } from '@/utils/app-navigation';

// TYPES
import type { SignUpFormStep, SignUpField } from './signUpFormTypes.js';
import type { FieldErrors } from '@/shared/types/types';

export type SignUpFormCopy = {
	signUpFailed: () => string;
	accountCreatedToast: () => string;
};

export function createSignUpForm(copy: SignUpFormCopy) {
	let step = $state<SignUpFormStep>('signUp');
	let busy = $state(false);
	let errorMessage = $state<string | null>(null);
	let fieldErrors = $state<FieldErrors<SignUpField>>({});
	let nameDraft = $state('');
	let emailDraft = $state('');
	let verifyContext = $state<{ name: string; email: string; password: string } | null>(null);

	async function onSignUpSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;

		const form = event.currentTarget as HTMLFormElement;
		const formData = new FormData(form);

		const p = signUpFormSchema.safeParse({
			name: String(formData.get('name') ?? ''),
			email: String(formData.get('email') ?? ''),
			password: String(formData.get('password') ?? ''),
			confirmPassword: String(formData.get('confirmPassword') ?? ''),
			flow: String(formData.get('flow') ?? '')
		});

		if (!p.success) {
			fieldErrors = zodIssuesToFieldErrors<SignUpField>(p.error.issues);
			errorMessage = null;
			return;
		}

		if (p.data.password !== p.data.confirmPassword) {
			fieldErrors = { confirmPassword: m['ValidationMessages.SignUpForm.passwordsMustMatch']() };
			errorMessage = null;
			return;
		}

		fieldErrors = {};
		busy = true;
		errorMessage = null;

		try {
			const { error } = await authClient.signUp.email({
				name: p.data.name,
				email: p.data.email,
				password: p.data.password
			});

			if (error) {
				console.error('Sign up failed:', error);
				if (/password/i.test(error.message ?? '')) {
					fieldErrors = { password: error.message ?? copy.signUpFailed() };
				} else {
					errorMessage = rateLimitMessage(error.message, copy.signUpFailed());
				}
				return;
			}

			nameDraft = p.data.name;
			emailDraft = p.data.email;
			verifyContext = {
				name: p.data.name,
				email: p.data.email,
				password: p.data.password
			};
			step = { email: p.data.email };
		} catch (error) {
			console.error('Sign up failed:', error);
			errorMessage = copy.signUpFailed();
		} finally {
			busy = false;
		}
	}

	function onCancel() {
		step = 'signUp';
		verifyContext = null;
		errorMessage = null;
		fieldErrors = {};
	}

	async function onVerifySuccess() {
		toast.success(copy.accountCreatedToast());
		await appGoto(PROTECTED_PAGE_ENDPOINTS.DASHBOARD);
	}	

	return {
		get step() {
			return step;
		},
		get busy() {
			return busy;
		},
		get errorMessage() {
			return errorMessage;
		},
		get fieldErrors() {
			return fieldErrors;
		},
		get nameDraft() {
			return nameDraft;
		},
		set nameDraft(v: string) {
			nameDraft = v;
		},
		get emailDraft() {
			return emailDraft;
		},
		set emailDraft(v: string) {
			emailDraft = v;
		},
		get verifyContext() {
			return verifyContext;
		},
		onSignUpSubmit,
		onCancel,
		onVerifySuccess
	};
}
