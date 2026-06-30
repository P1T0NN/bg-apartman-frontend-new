<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';
	import * as Card from '@/shared/components/ui/card/index.js';
	import EmailVerificationForm from '@/features/auth/components/email-verification-form/email-verification-form.svelte';
	import {
		FieldGroup,
		Field,
		FieldDescription,
		FieldError
	} from '@/shared/components/ui/field/index.js';
	import { FormField } from '@/shared/components/ui/form-field/index.js';
	import GoogleLoginButton from '@/features/auth/components/google-login-button/google-login-button.svelte';
	import { Input } from '@/shared/components/ui/input/index.js';
	import PasswordInput from '@/features/auth/components/password-input/password-input.svelte';
	import Link from '@/shared/components/ui/link/link.svelte';

	// TYPES
	import type { ComponentProps } from 'svelte';

	import { createSignUpForm } from './sign-up-form-model.svelte.js';

	let { ...restProps }: ComponentProps<typeof Card.Root> = $props();

	const id = $props.id();

	const form = createSignUpForm({
		signUpFailed: () => m['SignUpForm.SignUpFormNoImage.signUpFailed'](),
		accountCreatedToast: () => m['SignUpForm.SignUpFormNoImage.accountCreatedToast']()
	});
</script>

<Card.Root {...restProps}>
	{#if form.step === 'signUp'}
		<Card.Header>
			<Card.Title>{m['SignUpForm.SignUpFormNoImage.title']()}</Card.Title>
			<Card.Description>{m['SignUpForm.SignUpFormNoImage.description']()}</Card.Description>
		</Card.Header>

		<Card.Content>
			<form onsubmit={form.onSignUpSubmit}>
				<FieldGroup>
					<FormField
						id="name-{id}"
						label={m['SignUpForm.SignUpFormNoImage.fullName']()}
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
						label={m['SignUpForm.SignUpFormNoImage.email']()}
						error={form.fieldErrors.email}
						description={m['SignUpForm.SignUpFormNoImage.emailHelp']()}
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
						label={m['SignUpForm.SignUpFormNoImage.password']()}
						error={form.fieldErrors.password}
						description={m['SignUpForm.SignUpFormNoImage.passwordHelp']()}
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
						label={m['SignUpForm.SignUpFormNoImage.confirmPassword']()}
						error={form.fieldErrors.confirmPassword}
						description={m['SignUpForm.SignUpFormNoImage.confirmPasswordHelp']()}
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
						<Button type="submit" class="w-full" disabled={form.busy}>
							{m['SignUpForm.SignUpFormNoImage.submit']()}
						</Button>
						<GoogleLoginButton class="w-full" />

						<FieldDescription class="text-center">
							{m['SignUpForm.SignUpFormNoImage.alreadyHaveAccount']()}
							<Link href={UNPROTECTED_PAGE_ENDPOINTS.LOGIN}>
								{m['SignUpForm.SignUpFormNoImage.signIn']()}
							</Link>
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
