<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';
	import EmailVerificationForm from '@/features/auth/components/email-verification-form/email-verification-form.svelte';
	import {
		FieldGroup,
		Field,
		FieldDescription,
		FieldSeparator,
		FieldError
	} from '@/shared/components/ui/field/index.js';
	import { FormField } from '@/shared/components/ui/form-field/index.js';
	import GoogleLoginButton from '@/features/auth/components/google-login-button/google-login-button.svelte';
	import { Input } from '@/shared/components/ui/input/index.js';
	import PasswordInput from '@/features/auth/components/password-input/password-input.svelte';
	import Link from '@/shared/components/ui/link/link.svelte';

	// UTILS
	import { cn } from '@/shared/utils/utils.js';

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
		signUpFailed: () => m['SignUpForm.SignUpFormWithImage.signUpFailed'](),
		accountCreatedToast: () => m['SignUpForm.SignUpFormWithImage.accountCreatedToast']()
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
				<h1 class="text-2xl font-bold">{m['SignUpForm.SignUpFormWithImage.title']()}</h1>
				<p class="text-sm text-balance text-muted-foreground">
					{m['SignUpForm.SignUpFormWithImage.description']()}
				</p>
			</div>

			<FormField
				id="name-{id}"
				label={m['SignUpForm.SignUpFormWithImage.fullName']()}
				error={form.fieldErrors.name}
			>
				<Input
					id="name-{id}"
					name="name"
					type="text"
					autocomplete="name"
					placeholder="John Doe"
					autofocus
					bind:value={form.nameDraft}
					aria-invalid={form.fieldErrors.name ? 'true' : undefined}
				/>
			</FormField>

			<FormField
				id="email-{id}"
				label={m['SignUpForm.SignUpFormWithImage.email']()}
				error={form.fieldErrors.email}
				description={m['SignUpForm.SignUpFormWithImage.emailHelp']()}
			>
				<Input
					id="email-{id}"
					name="email"
					type="email"
					autocomplete="email"
					placeholder="m@example.com"
					bind:value={form.emailDraft}
					aria-invalid={form.fieldErrors.email ? 'true' : undefined}
				/>
			</FormField>

			<FormField
				id="password-{id}"
				label={m['SignUpForm.SignUpFormWithImage.password']()}
				error={form.fieldErrors.password}
				description={m['SignUpForm.SignUpFormWithImage.passwordHelp']()}
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
				label={m['SignUpForm.SignUpFormWithImage.confirmPassword']()}
				error={form.fieldErrors.confirmPassword}
				description={m['SignUpForm.SignUpFormWithImage.confirmPasswordHelp']()}
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
					{m['SignUpForm.SignUpFormWithImage.submit']()}
				</Button>
			</Field>

			<FieldSeparator>
				{m['SignUpForm.SignUpFormWithImage.orContinueWith']()}
			</FieldSeparator>

			<Field>
				<GoogleLoginButton class="w-full" />

				<FieldDescription class="px-6 text-center">
					{m['SignUpForm.SignUpFormWithImage.alreadyHaveAccount']()}
					<Link href={UNPROTECTED_PAGE_ENDPOINTS.LOGIN} class="underline underline-offset-4">
						{m['SignUpForm.SignUpFormWithImage.signIn']()}
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
