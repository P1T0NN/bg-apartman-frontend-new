<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { MutationFormFieldDef } from './types.js';

	let {
		field,
		inputId,
		value,
		setValue
	}: {
		field: MutationFormFieldDef;
		inputId: string;
		value: unknown;
		setValue: (next: unknown) => void;
	} = $props();

	const on = $derived(value === true);
	const Icon = $derived(field.icon);
</script>

<button
	id={inputId}
	type="button"
	role="switch"
	aria-checked={on}
	disabled={field.disabled}
	onclick={() => setValue(!on)}
	class={cn(
		'flex h-full w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors',
		'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
		'disabled:cursor-not-allowed disabled:opacity-50',
		on ? 'border-primary bg-primary/5' : 'border-border hover:border-input hover:bg-muted/40'
	)}
>
	{#if Icon}
		<span
			class={cn(
				'flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors',
				on ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
			)}
		>
			<Icon class="size-[18px]" />
		</span>
	{/if}

	<span class="min-w-0 flex-1">
		<span class="block text-sm font-medium text-foreground">{field.label}</span>
		{#if field.description}
			<span class="mt-0.5 block text-xs leading-snug text-muted-foreground">
				{field.description}
			</span>
		{/if}
	</span>

	<!-- Decorative switch; the whole tile is the control (role="switch" above). -->
	<span
		aria-hidden="true"
		class={cn(
			'relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
			on ? 'bg-primary' : 'bg-input'
		)}
	>
		<span
			class={cn(
				'absolute size-4 rounded-full bg-background shadow-sm transition-transform duration-200',
				on ? 'translate-x-[18px]' : 'translate-x-0.5'
			)}
		></span>
	</span>
</button>
