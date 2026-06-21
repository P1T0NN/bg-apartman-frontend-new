<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import SearchDropdownItem from './search-dropdown-item.svelte';
	import SearchEmpty from './search-empty.svelte';

	// UTILS
	import { cn } from '@/shared/utils/utils.js';

	// TYPES
	import type { SearchDropdownProps } from './types.js';

	let {
		listboxId,
		inputId,
		items,
		activeIndex = $bindable(0),
		dropdownClass,
		loading = false,
		error = null,
		loadingText = m['SearchInput.loading'](),
		emptyTitle,
		emptyDescription,
		onActiveIndexChange,
		onSelect
	}: SearchDropdownProps = $props();

	let hasResults = $derived(items.length > 0);

	function handleActiveIndexChange(index: number) {
		activeIndex = index;
		onActiveIndexChange?.(index);
	}
</script>

<div
	class={cn(
		'bg-popover text-popover-foreground ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-lg shadow-md ring-1 duration-100',
		dropdownClass
	)}
	data-open
>
	{#if loading}
		<div class="px-3 py-6 text-center">
			<p class="text-muted-foreground text-sm">{loadingText}</p>
		</div>
	{:else if error}
		<div class="px-3 py-6 text-center">
			<p class="text-destructive text-sm font-medium">{error}</p>
		</div>
	{:else if hasResults}
		<ul
			id={listboxId}
			role="listbox"
			aria-label={m['SearchInput.resultsLabel']()}
			class="max-h-80 overflow-y-auto p-1"
		>
			{#each items as item, index (item.id)}
				<li role="presentation">
					<SearchDropdownItem
						{item}
						optionId={`${inputId}-option-${item.id}`}
						active={index === activeIndex}
						onHover={() => handleActiveIndexChange(index)}
						onSelect={() => onSelect(item)}
					/>
				</li>
			{/each}
		</ul>
	{:else}
		<SearchEmpty title={emptyTitle} description={emptyDescription} />
	{/if}
</div>
