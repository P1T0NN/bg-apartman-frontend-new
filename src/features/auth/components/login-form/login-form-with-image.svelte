<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import {
		FieldGroup,
		Field,
		FieldLabel,
		FieldDescription,
		FieldSeparator,
		FieldError
	} from '@/components/ui/field/index.js';
	import { FormField } from '@/components/ui/form-field/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import PasswordInput from '@/features/auth/components/password-input/password-input.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import GoogleLoginButton from '@/features/auth/components/google-login-button/google-login-button.svelte';
	import Link from '@/components/ui/link/link.svelte';
	import EmailVerificationForm from '@/features/auth/components/email-verification-form/email-verification-form.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { LoginFormWithImageProps } from './loginFormTypes.js';

	import { createLoginForm } from './login-form-model.svelte.js';

	let { ref = $bindable(null), class: className, ...restProps }: LoginFormWithImageProps = $props();

	const id = $props.id();

	const form = createLoginForm({
		signInFailed: () => 'Sign in failed. Please check your credentials and try again.',
		signedInToast: () => 'Signed in successfully.'
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
				<h1 class="text-2xl font-bold">Login to your account</h1>
				<p class="text-sm text-balance text-muted-foreground">
					Enter your email below to login to your account
				</p>
			</div>

			<FormField id="email-{id}" label="Email" error={form.fieldErrors.email}>
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
					<FieldLabel for="password-{id}">Password</FieldLabel>
					<Link
						href={UNPROTECTED_PAGE_ENDPOINTS.FORGOT_PASSWORD}
						class="ms-auto text-sm underline-offset-4 hover:underline"
					>
						Forgot your password?
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
				<Button type="submit" disabled={form.busy}>Login</Button>
			</Field>

			<FieldSeparator>Or continue with</FieldSeparator>

			<Field>
				<GoogleLoginButton />

				<FieldDescription class="text-center">
					Don't have an account?

					<Link href={UNPROTECTED_PAGE_ENDPOINTS.SIGNUP} class="underline underline-offset-4">
						Sign up
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
