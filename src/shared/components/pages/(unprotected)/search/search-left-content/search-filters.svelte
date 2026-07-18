<script lang="ts">
	// COMPONENTS
	import { NativePopover } from '@/shared/components/ui/native-popover/index.js';
	import { Button } from '@/shared/components/ui/button/index.js';
	import SearchFiltersClearButton from './search-filters-clear-button.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { FILTER_DEFS, FILTER_OPTIONS, setFilter } from '../search-state';
	import type { FilterKey, SearchState } from '../types';

	// LUCIDE ICONS
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';

	let { search }: { search: SearchState } = $props();

	// Count of filters that aren't 'any' — shown as a badge on the trigger.
	const activeCount = $derived(FILTER_DEFS.filter((d) => search[d.key].current !== 'any').length);

	// Live filtering: each tap writes the URL and re-filters immediately. null = 'any' (cleared).
	function set(key: FilterKey, option: string) {
		setFilter(search, key, option === 'any' ? null : option);
	}
</script>

<NativePopover align="end" contentClass="w-72 space-y-4 p-4">
	{#snippet trigger({ props, anchorStyle })}
		<Button {...props} style={anchorStyle} variant="outline" size="sm" class="shrink-0 gap-1.5">
			<SlidersHorizontalIcon class="size-4" aria-hidden="true" />
			Filters
			{#if activeCount > 0}
				<span
					class="ml-0.5 grid size-5 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
				>
					{activeCount}
				</span>
			{/if}
		</Button>
	{/snippet}

	{#snippet content({ close })}
		{#each FILTER_DEFS as def (def.key)}
			<div class="space-y-1.5">
				<p class="text-sm font-medium">{def.label}</p>
				<div class="flex gap-0.5 rounded-lg border bg-muted/40 p-0.5">
					{#each FILTER_OPTIONS as option (option)}
						<button
							type="button"
							onclick={() => set(def.key, option)}
							class={cn(
								'flex-1 rounded-md px-2 py-1 text-sm font-medium transition',
								search[def.key].current === option
									? 'bg-background text-foreground shadow-sm'
									: 'text-muted-foreground hover:text-foreground'
							)}
						>
							{option === 'any' ? 'Any' : option}
						</button>
					{/each}
				</div>
			</div>
		{/each}

		<div class="flex items-center justify-between pt-1">
			<SearchFiltersClearButton {search} variant="ghost" size="sm" disabled={activeCount === 0}>
				Clear
			</SearchFiltersClearButton>

			<Button size="sm" onclick={close}>Done</Button>
		</div>
	{/snippet}
</NativePopover>
