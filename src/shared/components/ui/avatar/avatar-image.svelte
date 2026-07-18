<script lang="ts">
	import { untrack } from 'svelte';
	import type { HTMLImgAttributes } from 'svelte/elements';
	import { cn } from '@/utils/utils.js';
	import { getAvatarContext } from './avatar.svelte';

	let {
		ref = $bindable(null),
		src,
		alt,
		class: className,
		...restProps
	}: HTMLImgAttributes & { ref?: HTMLImageElement | null } = $props();

	const avatar = getAvatarContext();

	// A missing src is terminal — set it synchronously (first render, SSR included) so the fallback
	// initials show immediately instead of after the effect ticks (which would blank the avatar first).
	// One-time init from the initial src; the $effect below handles every later change.
	if (untrack(() => !src)) avatar.status = 'error';

	// Native <img> load/error drive the shared status — no state machine, no `new Image()`,
	// no DOMContext.getRootNode() (the bits-ui crash we're replacing). Reset to loading
	// whenever the src changes; a missing src falls straight through to the fallback.
	//
	// The events alone aren't enough: a memory-cached image (client-side nav back to a page)
	// or one that finished before hydration attached our listener has already fired load —
	// we'd wait forever on 'loading'. So when the element says it's done, read the verdict
	// off it directly instead of waiting for an event that already happened.
	$effect(() => {
		if (!src) {
			avatar.status = 'error';
		} else if (ref?.complete) {
			avatar.status = ref.naturalWidth > 0 ? 'loaded' : 'error';
		} else {
			avatar.status = 'loading';
		}
	});
</script>

{#if src}
	<img
		bind:this={ref}
		data-slot="avatar-image"
		{src}
		{alt}
		class={cn(
			'aspect-square size-full rounded-full object-cover',
			avatar.status !== 'loaded' && 'hidden',
			className
		)}
		onload={() => (avatar.status = 'loaded')}
		onerror={() => (avatar.status = 'error')}
		{...restProps}
	/>
{/if}
