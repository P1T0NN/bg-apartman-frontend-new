<script lang="ts">
	import { cn, type WithElementRef } from '@/utils/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<main
	bind:this={ref}
	data-slot="sidebar-inset"
	class={cn(
		// `min-w-0` lets this flex child shrink below its content's intrinsic width so wide
		// content (e.g. a data table) scrolls inside its own `overflow-x-auto` container
		// instead of stretching the inset and giving the whole page a horizontal scrollbar.
		'relative flex w-full min-w-0 flex-1 flex-col bg-background md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</main>
