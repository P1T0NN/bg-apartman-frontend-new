<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants';

	// COMPONENTS
	import {
		FieldGroup,
		Field,
		FieldLabel,
		FieldDescription,
		FieldSeparator,
		FieldError
	} from '@/shared/components/ui/field/index.js';
	import { FormField } from '@/shared/components/ui/form-field/index.js';
	import { Input } from '@/shared/components/ui/input/index.js';
	import PasswordInput from '@/features/auth/components/password-input/password-input.svelte';
	import { Button } from '@/shared/components/ui/button/index.js';
	import GoogleLoginButton from '@/features/auth/components/google-login-button/google-login-button.svelte';
	import Link from '@/shared/components/ui/link/link.svelte';
	import EmailVerificationForm from '@/features/auth/components/email-verification-form/email-verification-form.svelte';

	// UTILS
	import { cn } from '@/shared/utils/utils.js';

	// TYPES
	import type { LoginFormWithImageProps } from './loginFormTypes.js';

	import { createLoginForm } from './login-form-model.svelte.js';

	let { ref = $bindable(null), class: className, ...restProps }: LoginFormWithImageProps = $props();

	const id = $props.id();

	const form = createLoginForm({
		signInFailed: () => m['LoginForm.LoginFormWithImage.signInFailed'](),
		signedInToast: () => m['LoginForm.LoginFormWithImage.signedInToast']()
	});
</script>

{#if form.step === 'signIn'}
	<form
		class={cn('flex flex-col gap-6', className)}
		bind:this={ref}
		onsubmit={form.onSignInSubmit}
		{...restProps}
	>
		<FieldGroup>
			<div class="flex flex-col items-center gap-1 text-center">
				<h1 class="text-2xl font-bold">{m['LoginForm.LoginFormWithImage.title']()}</h1>
				<p class="text-sm text-balance text-muted-foreground">
					{m['LoginForm.LoginFormWithImage.description']()}
				</p>
			</div>

			<FormField
				id="email-{id}"
				label={m['LoginForm.LoginFormWithImage.email']()}
				error={form.fieldErrors.email}
			>
				<Input
					id="email-{id}"
					name="email"
					type="email"
					autocomplete="email"
					placeholder="m@example.com"
					autofocus
					bind:value={form.emailDraft}
					aria-invalid={form.fieldErrors.email ? 'true' : undefined}
				/>
			</FormField>

			<Field>
				<div class="flex items-center">
					<FieldLabel for="password-{id}">
						{m['LoginForm.LoginFormWithImage.password']()}
					</FieldLabel>
					<Link
						href={UNPROTECTED_PAGE_ENDPOINTS.FORGOT_PASSWORD}
						class="ms-auto text-sm underline-offset-4 hover:underline"
					>
						{m['LoginForm.LoginFormWithImage.forgotPassword']()}
					</Link>
				</div>
				<PasswordInput
					id="password-{id}"
					name="password"
					autocomplete="current-password"
					aria-invalid={form.fieldErrors.password ? 'true' : undefined}
				/>
				{#if form.fieldErrors.password}
					<FieldError>{form.fieldErrors.password}</FieldError>
				{/if}
			</Field>

			<input type="hidden" name="flow" value="signIn" />

			{#if form.errorMessage}
				<FieldError>{form.errorMessage}</FieldError>
			{/if}

			<Field>
				<Button type="submit" disabled={form.busy}>
					{m['LoginForm.LoginFormWithImage.submit']()}
				</Button>
			</Field>

			<FieldSeparator>{m['LoginForm.LoginFormWithImage.orContinueWith']()}</FieldSeparator>

			<Field>
				<GoogleLoginButton />

				<FieldDescription class="text-center">
					{m['LoginForm.LoginFormWithImage.dontHaveAccount']()}

					<Link href={UNPROTECTED_PAGE_ENDPOINTS.SIGNUP} class="underline underline-offset-4">
						{m['LoginForm.LoginFormWithImage.signUp']()}
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
