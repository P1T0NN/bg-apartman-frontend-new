<script lang="ts">
	// COMPONENTS
	import { Card } from '@/shared/components/ui/card/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Component } from 'svelte';

	let {
		label,
		value,
		hint,
		icon: Icon,
		iconClass,
		emphasized = false
	}: {
		label: string;
		value: string;
		hint: string;
		icon: Component;
		iconClass: string;
		emphasized?: boolean;
	} = $props();
</script>

<Card
	class={cn(
		'gap-0 p-4 transition-colors',
		emphasized && 'ring-1 ring-amber-500/30 dark:ring-amber-400/20'
	)}
>
	<div class="flex items-center gap-3">
		<div class={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', iconClass)}>
			<Icon class="size-5" aria-hidden="true" />
		</div>
		<p class="text-2xl font-semibold tracking-tight tabular-nums md:text-3xl">{value}</p>
	</div>
	<div class="mt-3 space-y-0.5">
		<p class="text-sm font-medium">{label}</p>
		<p class="truncate text-xs text-muted-foreground">{hint}</p>
	</div>
</Card>
