<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import * as Card from '@/components/ui/card/index.js';
	import EmailVerificationForm from '@/features/auth/components/email-verification-form/email-verification-form.svelte';
	import { FieldGroup, Field, FieldDescription, FieldError } from '@/components/ui/field/index.js';
	import { FormField } from '@/components/ui/form-field/index.js';
	import GoogleLoginButton from '@/features/auth/components/google-login-button/google-login-button.svelte';
	import { Input } from '@/components/ui/input/index.js';
	import PasswordInput from '@/features/auth/components/password-input/password-input.svelte';
	import Link from '@/components/ui/link/link.svelte';

	// TYPES
	import type { ComponentProps } from 'svelte';

	import { createSignUpForm } from './sign-up-form-model.svelte.js';

	let { ...restProps }: ComponentProps<typeof Card.Root> = $props();

	const id = $props.id();

	const form = createSignUpForm({
		signUpFailed: () =>
			"We couldn't create your account. Check your details and try again, or sign in if you already have one.",
		accountCreatedToast: () => 'Account created successfully.'
	});
</script>

<Card.Root {...restProps}>
	{#if form.step === 'signUp'}
		<Card.Header>
			<Card.Title>Create an account</Card.Title>
			<Card.Description>Enter your information below to create your account</Card.Description>
		</Card.Header>

		<Card.Content>
			<form onsubmit={form.onSignUpSubmit}>
				<FieldGroup>
					<FormField id="name-{id}" label="Full Name" error={form.fieldErrors.name}>
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
						label="Email"
						error={form.fieldErrors.email}
						description="We'll use this to contact you. We will not share your email with anyone else."
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
						label="Password"
						error={form.fieldErrors.password}
						description="Must be at least 8 characters long."
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
						label="Confirm Password"
						error={form.fieldErrors.confirmPassword}
						description="Please confirm your password."
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
						<Button type="submit" class="w-full" disabled={form.busy}>Create Account</Button>
						<GoogleLoginButton class="w-full" />

						<FieldDescription class="text-center">
							Already have an account?
							<Link href={UNPROTECTED_PAGE_ENDPOINTS.LOGIN}>Sign in</Link>
						</FieldDescription>
					</Field>
				</FieldGroup>
			</form>
		</Card.Content>
	{:else}
		<EmailVerificationForm
			variant="card"
			email={form.step.email}
			fullWidthButtons
			onCancel={form.onCancel}
			onSuccess={form.onVerifySuccess}
			resend={form.verifyContext
				? { email: form.verifyContext.email, type: 'email-verification' }
				: undefined}
		/>
	{/if}
</Card.Root>
