<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import * as Card from '@/components/ui/card/index.js';
	import GoogleLoginButton from '@/features/auth/components/google-login-button/google-login-button.svelte';
	import { Input } from '@/components/ui/input/index.js';
	import PasswordInput from '@/features/auth/components/password-input/password-input.svelte';
	import Link from '@/components/ui/link/link.svelte';
	import EmailVerificationForm from '@/features/auth/components/email-verification-form/email-verification-form.svelte';
	import {
		FieldGroup,
		Field,
		FieldLabel,
		FieldDescription,
		FieldError
	} from '@/components/ui/field/index.js';
	import { FormField } from '@/components/ui/form-field/index.js';

	import { createLoginForm } from './login-form-model.svelte.js';

	const id = $props.id();

	const form = createLoginForm({
		signInFailed: () => m['LoginPage.LoginFormNoImage.signInFailed'](),
		signedInToast: () => m['LoginPage.LoginFormNoImage.signedInToast']()
	});
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	{#if form.step === 'signIn'}
		<Card.Header>
			<Card.Title class="text-2xl">{m['LoginPage.LoginFormNoImage.login']()}</Card.Title>
			<Card.Description>{m['LoginPage.LoginFormNoImage.loginDescription']()}</Card.Description>
		</Card.Header>

		<Card.Content>
			<form onsubmit={form.onSignInSubmit}>
				<FieldGroup>
					<FormField id="email-{id}" label={m['LoginPage.LoginFormNoImage.email']()} error={form.fieldErrors.email}>
						<Input
							id="email-{id}"
							name="email"
							type="email"
							autocomplete="email"
							placeholder={m['LoginPage.LoginFormNoImage.emailPlaceholder']()}
							autofocus
							bind:value={form.emailDraft}
							aria-invalid={form.fieldErrors.email ? 'true' : undefined}
						/>
					</FormField>

					<Field>
						<div class="flex items-center">
							<FieldLabel for="password-{id}">{m['LoginPage.LoginFormNoImage.password']()}</FieldLabel>

							<Link
								href={UNPROTECTED_PAGE_ENDPOINTS.FORGOT_PASSWORD}
								class="ms-auto inline-block text-sm underline"
							>
								{m['LoginPage.LoginFormNoImage.forgotPassword']()}
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
						<Button type="submit" class="w-full" disabled={form.busy}>
							{m['LoginPage.LoginFormNoImage.login']()}
						</Button>
						<GoogleLoginButton class="w-full" />

						<FieldDescription class="text-center">
							{m['LoginPage.LoginFormNoImage.noAccount']()}
							<Link href={UNPROTECTED_PAGE_ENDPOINTS.SIGNUP}>
								{m['LoginPage.LoginFormNoImage.signUp']()}
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
