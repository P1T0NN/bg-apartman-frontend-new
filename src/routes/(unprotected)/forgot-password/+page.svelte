<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import PasswordResetForm from '@/features/auth/components/password-reset-form/password-reset-form.svelte';
</script>

<SvelteHead
	title={m['ForgotPasswordPage.SEO.title']()}
	description={m['ForgotPasswordPage.SEO.description']()}
	noIndex
/>

<div class="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
	<div class="w-full max-w-sm">
		<PasswordResetForm />
	</div>
</div>
