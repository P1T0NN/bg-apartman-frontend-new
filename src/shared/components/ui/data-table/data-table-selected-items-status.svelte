<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import ActionButton from '@/shared/components/ui/action-button/action-button.svelte';
	import { Button } from '@/shared/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/shared/utils/utils.js';

	// LUCIDE ICONS
	import CheckIcon from '@lucide/svelte/icons/check';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	type Props = {
		count: number;
		onClear: () => void;
		class?: string;
		/** Render built-in bulk-action buttons (currently: Delete). */
		withActionButtons?: boolean;
		/** Passed to the Delete button; required when `withActionButtons` is on. */
		deleteFunction?: () => Promise<void> | void;
		/** Forwards to the Delete button's AlertDialog confirm action (spinner + disable). */
		isDeleting?: boolean;
	};

	let {
		count,
		onClear,
		class: className,
		withActionButtons = true,
		deleteFunction,
		isDeleting = false
	}: Props = $props();

	const canRenderDelete = $derived(withActionButtons && typeof deleteFunction === 'function');
</script>

<div
	role="status"
	aria-live="polite"
	class={cn(
		'bg-primary/5 border-primary/20 flex items-center justify-between gap-3 rounded-lg border px-3 py-2',
		className
	)}
>
	<div class="flex min-w-0 items-center gap-2">
		<span
			class="bg-primary/15 text-primary grid size-6 shrink-0 place-items-center rounded-full"
			aria-hidden="true"
		>
			<CheckIcon class="size-3.5" />
		</span>

		<span class="text-foreground truncate text-sm font-medium tabular-nums">
			{m['DataTable.itemsSelected']({ count })}
		</span>
	</div>

	<div class="flex shrink-0 items-center gap-2">
		{#if canRenderDelete && deleteFunction}
			<ActionButton function={deleteFunction} variant="destructive" isPending={isDeleting}>
				<Trash2Icon />
				<span>{m['DataTable.delete']()}</span>
				{#if count > 0}
					<span class="tabular-nums opacity-80">({count})</span>
				{/if}
			</ActionButton>
		{/if}
		<Button
			type="button"
			variant="ghost"
			size="sm"
			disabled={isDeleting}
			onclick={onClear}
		>
			{m['DataTable.clearSelection']()}
		</Button>
	</div>
</div>
