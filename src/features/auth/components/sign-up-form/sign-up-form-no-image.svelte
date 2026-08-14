<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

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
		signUpFailed: () => m['SignUpPage.SignUpFormNoImage.signUpFailed'](),
		accountCreatedToast: () => m['SignUpPage.SignUpFormNoImage.accountCreatedToast']()
	});
</script>

<Card.Root {...restProps}>
	{#if form.step === 'signUp'}
		<Card.Header>
			<Card.Title>{m['SignUpPage.SignUpFormNoImage.createAccountTitle']()}</Card.Title>
			<Card.Description>{m['SignUpPage.SignUpFormNoImage.createAccountDescription']()}</Card.Description>
		</Card.Header>

		<Card.Content>
			<form onsubmit={form.onSignUpSubmit}>
				<FieldGroup>
					<FormField
						id="name-{id}"
						label={m['SignUpPage.SignUpFormNoImage.fullName']()}
						error={form.fieldErrors.name}
					>
						<Input
							id="name-{id}"
							name="name"
							type="text"
							autocomplete="name"
							placeholder={m['SignUpPage.SignUpFormNoImage.fullNamePlaceholder']()}
							autofocus
							bind:value={form.nameDraft}
							aria-invalid={form.fieldErrors.name ? 'true' : undefined}
						/>
					</FormField>

					<FormField
						id="email-{id}"
						label={m['SignUpPage.SignUpFormNoImage.email']()}
						error={form.fieldErrors.email}
						description={m['SignUpPage.SignUpFormNoImage.emailDescription']()}
					>
						<Input
							id="email-{id}"
							name="email"
							type="email"
							autocomplete="email"
							placeholder={m['SignUpPage.SignUpFormNoImage.emailPlaceholder']()}
							bind:value={form.emailDraft}
							aria-invalid={form.fieldErrors.email ? 'true' : undefined}
						/>
					</FormField>

					<FormField
						id="password-{id}"
						label={m['SignUpPage.SignUpFormNoImage.password']()}
						error={form.fieldErrors.password}
						description={m['SignUpPage.SignUpFormNoImage.passwordDescription']()}
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
						label={m['SignUpPage.SignUpFormNoImage.confirmPassword']()}
						error={form.fieldErrors.confirmPassword}
						description={m['SignUpPage.SignUpFormNoImage.confirmPasswordDescription']()}
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
							{m['SignUpPage.SignUpFormNoImage.createAccount']()}
						</Button>
						<GoogleLoginButton class="w-full" />

						<FieldDescription class="text-center">
							{m['SignUpPage.SignUpFormNoImage.alreadyHaveAccount']()}
							<Link href={UNPROTECTED_PAGE_ENDPOINTS.LOGIN}>
								{m['SignUpPage.SignUpFormNoImage.signIn']()}
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
