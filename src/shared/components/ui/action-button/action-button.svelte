<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import { AlertDialog } from '@/shared/components/ui/alert-dialog/index.js';
	import { Button } from '@/shared/components/ui/button/index.js';
	import { type ButtonSize, type ButtonVariant } from '@/shared/components/ui/button/index.js';

	// LUCIDE ICONS
	import { Loader } from '@lucide/svelte';

	type Props = {
		/** Confirmed-action handler. Invoked after the user clicks the dialog's confirm button. */
		function: () => Promise<void> | void;
		/** Trigger content (icon, label, count, etc.). */
		children: import('svelte').Snippet;
		/** Button variant applied to the trigger button. */
		variant?: ButtonVariant;
		/** Trigger button size. */
		size?: ButtonSize;
		class?: string;
		/** Shows a spinner on the confirm action and disables it while the action is running. */
		isPending?: boolean;
		/** When true, renders the confirm action as disabled. Use for form-validity / typed-confirm gates. */
		actionDisabled?: boolean;
		/** When true, the dialog gets destructive styling (red-tinted title, destructive action button). */
		isDestructive?: boolean;
		/** When true, the proceed/action button is hidden — only the cancel button remains. */
		hideProceed?: boolean;
		/** Dialog copy overrides; fall back to the shared confirm-dialog defaults. */
		title?: string;
		description?: string;
		/** Optional form fields or context rendered between the description and the footer. */
		body?: import('svelte').Snippet;
	};

	let {
		function: actionFunction,
		children: triggerContent,
		variant = 'default',
		size = 'sm',
		class: className,
		isPending = false,
		actionDisabled = false,
		isDestructive = false,
		hideProceed = false,
		title,
		description,
		body
	}: Props = $props();

	let open = $state(false);

	async function handleAction() {
		await actionFunction();
		open = false;
	}
</script>

<AlertDialog
	bind:open
	triggerVariant={variant}
	triggerSize={size}
	triggerClass={className}
	class={isDestructive ? 'ring-destructive/30' : ''}
>
	{#snippet triggerChildren()}
		{@render triggerContent()}
	{/snippet}

	<div class="alert-dialog__header">
		<h2 class={isDestructive ? 'text-destructive' : ''}>
			{title ?? m['AlertDialogButton.title']()}
		</h2>
		<p>{description ?? m['AlertDialogButton.description']()}</p>
	</div>

	{#if body}
		<div class="py-2">
			{@render body()}
		</div>
	{/if}

	<div class="alert-dialog__footer">
		<Button type="button" variant="outline" onclick={() => (open = false)} disabled={isPending}>
			{m['AlertDialogButton.cancel']()}
		</Button>

		{#if !hideProceed}
			<Button
				type="button"
				onclick={handleAction}
				variant={isDestructive ? 'destructive' : 'default'}
				disabled={isPending || actionDisabled}
			>
				{#if isPending}
					<Loader class="h-3 w-3 animate-spin" />
				{/if}
				{m['AlertDialogButton.proceed']()}
			</Button>
		{/if}
	</div>
</AlertDialog>
