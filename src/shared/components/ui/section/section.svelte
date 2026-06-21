<script lang="ts">
	// UTILS
	import { cn } from '@/shared/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';

	type YPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';
	type Surface = 'transparent' | 'background' | 'muted';

	type Props = {
		class?: string;
		/** Classes on the inner wrapper (e.g. grid / flex layouts). */
		containerClass?: string;
		children: Snippet;
		/**
		 * When true, inner content uses the same horizontal padding and max width
		 * as header/footer (`max-w-7xl`).
		 */
		contain?: boolean;
		/** Vertical padding for the section block. */
		yPadding?: YPadding;
		/** Optional band using existing theme surfaces. */
		surface?: Surface;
		id?: string;
		ariaLabelledby?: string;
	};

	let {
		class: className,
		containerClass,
		children,
		contain = true,
		yPadding = 'md',
		surface = 'transparent',
		id = undefined,
		ariaLabelledby = undefined
	}: Props = $props();

	const yPaddingClass: Record<YPadding, string> = {
		none: '',
		sm: 'py-8 sm:py-10',
		md: 'py-12 sm:py-14 lg:py-16',
		lg: 'py-16 sm:py-20 lg:py-24',
		xl: 'py-20 sm:py-24 lg:py-32'
	};

	const surfaceClass: Record<Surface, string> = {
		transparent: '',
		background: 'bg-background',
		muted: 'bg-muted'
	};
</script>

<section
	{id}
	aria-labelledby={ariaLabelledby}
	class={cn(
		'w-full min-w-0 max-w-full overflow-x-clip',
		surfaceClass[surface],
		yPaddingClass[yPadding],
		className
	)}
>
	{#if contain}
		<div
			class={cn(
				'mx-auto w-full min-w-0 max-w-7xl px-4 sm:px-6 lg:px-8',
				containerClass
			)}
		>
			{@render children()}
		</div>
	{:else}
		<div class={cn('min-w-0', containerClass)}>
			{@render children()}
		</div>
	{/if}
</section>
