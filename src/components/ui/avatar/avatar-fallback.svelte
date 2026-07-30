<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '@/utils/utils.js';
	import { getAvatarContext } from './avatar.svelte';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();

	const avatar = getAvatarContext();
</script>

<!-- Only when there's genuinely no image to show: no src or a failed load (both resolve to 'error').
     During 'loading' we render nothing rather than flashing initials over an image that's about to appear. -->
{#if avatar.status === 'error'}
	<span
		bind:this={ref}
		data-slot="avatar-fallback"
		class={cn(
			'flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs',
			className
		)}
		{...restProps}
	>
		{@render children?.()}
	</span>
{/if}
