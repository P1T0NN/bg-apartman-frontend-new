<script lang="ts">
	import { Separator } from '@/shared/components/ui/separator/index.js';
	import { cn } from '@/utils/utils.js';
	import type { ComponentProps } from 'svelte';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ComponentProps<typeof Separator> = $props();
</script>

<Separator
	bind:ref
	data-slot="select-separator"
	class={cn('pointer-events-none -mx-1 my-1 h-px bg-border', className)}
	{...restProps}
/>
