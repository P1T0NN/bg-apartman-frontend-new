<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import EmailVerificationForm from '@/features/auth/components/email-verification-form/email-verification-form.svelte';
	import {
		FieldGroup,
		Field,
		FieldDescription,
		FieldSeparator,
		FieldError
	} from '@/components/ui/field/index.js';
	import { FormField } from '@/components/ui/form-field/index.js';
	import GoogleLoginButton from '@/features/auth/components/google-login-button/google-login-button.svelte';
	import { Input } from '@/components/ui/input/index.js';
	import PasswordInput from '@/features/auth/components/password-input/password-input.svelte';
	import Link from '@/components/ui/link/link.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { SignUpFormWithImageProps } from './signUpFormTypes.js';

	import { createSignUpForm } from './sign-up-form-model.svelte.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: SignUpFormWithImageProps = $props();

	const id = $props.id();

	const form = createSignUpForm({
		signUpFailed: () => m['SignUpPage.SignUpFormWithImage.signUpFailed'](),
		accountCreatedToast: () => m['SignUpPage.SignUpFormWithImage.accountCreatedToast']()
	});
</script>

{#if form.step === 'signUp'}
	<form
		class={cn('flex flex-col gap-6', className)}
		bind:this={ref}
		onsubmit={form.onSignUpSubmit}
		{...restProps}
	>
		<FieldGroup>
			<div class="flex flex-col items-center gap-1 text-center">
				<h1 class="text-2xl font-bold">{m['SignUpPage.SignUpFormWithImage.createAccountTitle']()}</h1>
				<p class="text-sm text-balance text-muted-foreground">
					{m['SignUpPage.SignUpFormWithImage.createAccountDescription']()}
				</p>
			</div>

			<FormField
				id="name-{id}"
				label={m['SignUpPage.SignUpFormWithImage.fullName']()}
				error={form.fieldErrors.name}
			>
				<Input
					id="name-{id}"
					name="name"
					type="text"
					autocomplete="name"
					placeholder={m['SignUpPage.SignUpFormWithImage.fullNamePlaceholder']()}
					autofocus
					bind:value={form.nameDraft}
					aria-invalid={form.fieldErrors.name ? 'true' : undefined}
				/>
			</FormField>

			<FormField
				id="email-{id}"
				label={m['SignUpPage.SignUpFormWithImage.email']()}
				error={form.fieldErrors.email}
				description={m['SignUpPage.SignUpFormWithImage.emailDescription']()}
			>
				<Input
					id="email-{id}"
					name="email"
					type="email"
					autocomplete="email"
					placeholder={m['SignUpPage.SignUpFormWithImage.emailPlaceholder']()}
					bind:value={form.emailDraft}
					aria-invalid={form.fieldErrors.email ? 'true' : undefined}
				/>
			</FormField>

			<FormField
				id="password-{id}"
				label={m['SignUpPage.SignUpFormWithImage.password']()}
				error={form.fieldErrors.password}
				description={m['SignUpPage.SignUpFormWithImage.passwordDescription']()}
			>
				<PasswordInput
					id="password-{id}"
					name="password"
					autocomplete="new-password"
					aria-invalid={form.fieldErrors.password ? 'true' : undefined}
				/>
			</FormField>

			<FormField
				id="confirm-password-{id}"
				label={m['SignUpPage.SignUpFormWithImage.confirmPassword']()}
				error={form.fieldErrors.confirmPassword}
				description={m['SignUpPage.SignUpFormWithImage.confirmPasswordDescription']()}
			>
				<PasswordInput
					id="confirm-password-{id}"
					name="confirmPassword"
					autocomplete="new-password"
					aria-invalid={form.fieldErrors.confirmPassword ? 'true' : undefined}
				/>
			</FormField>

			<input type="hidden" name="flow" value="signUp" />

			{#if form.errorMessage}
				<FieldError>{form.errorMessage}</FieldError>
			{/if}

			<Field>
				<Button type="submit" disabled={form.busy}>
					{m['SignUpPage.SignUpFormWithImage.createAccount']()}
				</Button>
			</Field>

			<FieldSeparator>{m['SignUpPage.SignUpFormWithImage.orContinueWith']()}</FieldSeparator>

			<Field>
				<GoogleLoginButton class="w-full" />

				<FieldDescription class="px-6 text-center">
					{m['SignUpPage.SignUpFormWithImage.alreadyHaveAccount']()}
					<Link href={UNPROTECTED_PAGE_ENDPOINTS.LOGIN} class="underline underline-offset-4">
						{m['SignUpPage.SignUpFormWithImage.signIn']()}
					</Link>
				</FieldDescription>
			</Field>
		</FieldGroup>
	</form>
{:else}
	<EmailVerificationForm
		email={form.step.email}
		onCancel={form.onCancel}
		onSuccess={form.onVerifySuccess}
		resend={form.verifyContext
			? { email: form.verifyContext.email, type: 'email-verification' }
			: undefined}
		class={cn('flex flex-col gap-6', className)}
		bind:ref
		{...restProps}
	/>
{/if}
