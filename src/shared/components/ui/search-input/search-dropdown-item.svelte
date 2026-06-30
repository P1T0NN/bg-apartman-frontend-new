<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { SearchDropdownItemProps } from './types.js';

	// LUCIDE ICONS
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';

	let { item, optionId, active, onSelect, onHover }: SearchDropdownItemProps = $props();
</script>

<button
	id={optionId}
	type="button"
	role="option"
	aria-selected={active}
	class={cn(
		'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors outline-none',
		active ? 'bg-accent text-accent-foreground' : 'hover:bg-muted hover:text-foreground'
	)}
	onmouseenter={onHover}
	onmousedown={(event) => event.preventDefault()}
	onclick={onSelect}
>
	<span
		class={cn(
			'flex size-8 shrink-0 items-center justify-center rounded-md border text-xs font-medium',
			active
				? 'border-accent-foreground/20 bg-accent-foreground/10 text-accent-foreground'
				: 'border-border bg-muted text-muted-foreground'
		)}
	>
		{item.title.slice(0, 1)}
	</span>

	<span class="min-w-0 flex-1">
		<span class="block truncate font-medium">{item.title}</span>
		{#if item.description}
			<span
				class={cn(
					'mt-0.5 block truncate text-xs',
					active ? 'text-accent-foreground/80' : 'text-muted-foreground'
				)}
			>
				{item.description}
			</span>
		{/if}
	</span>

	{#if item.category}
		<span
			class={cn(
				'hidden shrink-0 rounded-md px-1.5 py-0.5 text-xs sm:inline-flex',
				active ? 'bg-accent-foreground/10 text-accent-foreground' : 'bg-secondary text-secondary-foreground'
			)}
		>
			{item.category}
		</span>
	{/if}

	<ArrowUpRightIcon
		class={cn('size-3.5 shrink-0', active ? 'text-accent-foreground' : 'text-muted-foreground')}
		aria-hidden="true"
	/>
</button>
