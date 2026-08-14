<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import * as Card from '@/components/ui/card/index.js';
	import * as InputOTP from '@/features/auth/components/input-otp/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import PasswordInput from '@/features/auth/components/password-input/password-input.svelte';
	import {
		FieldGroup,
		Field,
		FieldLabel,
		FieldDescription,
		FieldError
	} from '@/components/ui/field/index.js';
	import { FormField } from '@/components/ui/form-field/index.js';
	import EmailVerificationResend from '@/features/auth/components/email-verification-form/email-verification-resend.svelte';

	import { createPasswordResetForm } from './password-reset-form-model.svelte.js';

	/** Matches `convexGenerateVerificationToken` and `passwordResetVerifyFormSchema`. */
	const OTP_MAX_LENGTH = 8;

	const id = $props.id();

	const form = createPasswordResetForm();
</script>

{#if form.step === 'forgot'}
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">{m['AuthFeature.PasswordResetForm.resetPassword']()}</Card.Title>
			<Card.Description>{m['AuthFeature.PasswordResetForm.resetDescription']()}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form onsubmit={form.onForgotSubmit}>
				<FieldGroup>
					<FormField
						id="pr-email-{id}"
						label={m['AuthFeature.PasswordResetForm.email']()}
						error={form.fieldErrors.email}
					>
						<Input
							id="pr-email-{id}"
							name="email"
							type="email"
							autocomplete="email"
							placeholder={m['AuthFeature.PasswordResetForm.emailPlaceholder']()}
							autofocus
							bind:value={form.emailDraft}
							aria-invalid={form.fieldErrors.email ? 'true' : undefined}
						/>
					</FormField>

					<input type="hidden" name="flow" value="reset" />
					{#if form.errorMessage}
						<FieldError>{form.errorMessage}</FieldError>
					{/if}

					<Field>
						<Button type="submit" class="w-full" disabled={form.busy}>
							{m['AuthFeature.PasswordResetForm.sendCode']()}
						</Button>
					</Field>
				</FieldGroup>
			</form>
		</Card.Content>
	</Card.Root>
{:else}
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">{m['AuthFeature.PasswordResetForm.chooseNewPassword']()}</Card.Title>
			<Card.Description class="text-balance">
				{m['AuthFeature.PasswordResetForm.codeSent']({ email: form.step.email })}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form onsubmit={form.onResetSubmit}>
				<FieldGroup>
					<Field>
						<FieldLabel for="pr-code-{id}">{m['AuthFeature.PasswordResetForm.code']()}</FieldLabel>
						<InputOTP.Root
							id="pr-otp-{id}"
							inputId="pr-code-{id}"
							maxlength={OTP_MAX_LENGTH}
							name="code"
							required
							autofocus
							disabled={form.busy}
							aria-invalid={form.fieldErrors.code ? 'true' : undefined}
						>
							{#snippet children({ cells })}
								<InputOTP.Group
									class="gap-2.5 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border"
								>
									{#each cells as cell, i (i)}
										<InputOTP.Slot {cell} />
									{/each}
								</InputOTP.Group>
							{/snippet}
						</InputOTP.Root>
						<FieldDescription>{m['AuthFeature.PasswordResetForm.codeDescription']()}</FieldDescription>
						{#if form.fieldErrors.code}
							<FieldError>{form.fieldErrors.code}</FieldError>
						{/if}
					</Field>

					<FormField
						id="pr-new-pw-{id}"
						label={m['AuthFeature.PasswordResetForm.newPassword']()}
						error={form.fieldErrors.newPassword}
					>
						<PasswordInput
							id="pr-new-pw-{id}"
							name="newPassword"
							autocomplete="new-password"
							bind:value={form.newPassword}
							aria-invalid={form.fieldErrors.newPassword ? 'true' : undefined}
						/>
					</FormField>

					<FormField
						id="pr-confirm-pw-{id}"
						label={m['AuthFeature.PasswordResetForm.confirmNewPassword']()}
						error={form.fieldErrors.confirmPassword}
					>
						<PasswordInput
							id="pr-confirm-pw-{id}"
							autocomplete="new-password"
							bind:value={form.confirmPassword}
							aria-invalid={form.fieldErrors.confirmPassword ? 'true' : undefined}
						/>
					</FormField>

					<input type="hidden" name="email" value={form.step.email} />
					<input type="hidden" name="flow" value="reset-verification" />

					{#if form.errorMessage}
						<FieldError>{form.errorMessage}</FieldError>
					{/if}

					<Field>
						<Button type="submit" class="w-full" disabled={form.busy}>
							{m['AuthFeature.PasswordResetForm.continue']()}
						</Button>
						<Button
							type="button"
							variant="outline"
							class="w-full"
							disabled={form.busy}
							onclick={form.backToForgot}
						>
							{m['AuthFeature.PasswordResetForm.cancel']()}
						</Button>
					</Field>

					<EmailVerificationResend
						disabled={form.busy}
						config={{ email: form.step.email, type: 'forget-password' }}
						onSendingChange={(inFlight) => {
							if (inFlight) {
								form.busy = true;
								form.errorMessage = null;
							} else {
								form.busy = false;
							}
						}}
					/>
				</FieldGroup>
			</form>
		</Card.Content>
	</Card.Root>
{/if}
