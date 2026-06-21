<script lang="ts">
	// UTILS
	import { cn } from '@/shared/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';

	type Variant = 'default' | 'selected' | 'muted';

	type Props = {
		/** Quick text label (e.g. a price). Ignored when children are provided. */
		label?: string;
		variant?: Variant;
		/** Render a small dot instead of the full tag — the cheap tier for zoomed-out views. */
		compact?: boolean;
		class?: string;
		/** Render anything you want inside the tag. */
		children?: Snippet;
	};

	let { label, variant = 'default', compact = false, class: className, children }: Props = $props();

	const pillClass: Record<Variant, string> = {
		default: 'bg-background text-foreground border-border',
		selected: 'bg-primary text-primary-foreground border-primary',
		muted: 'bg-muted text-muted-foreground border-border'
	};

	const dotClass: Record<Variant, string> = {
		default: 'bg-primary',
		selected: 'bg-primary ring-2 ring-primary/40',
		muted: 'bg-muted-foreground'
	};
</script>

{#if compact}
	<!--
		Cheap tier: a single dot, no shadow/extra DOM. translate-y-1/2 centers it on
		the coordinate (content is otherwise anchored by its bottom-center).
	-->
	<div
		class={cn(
			'translate-y-1/2 cursor-pointer rounded-full border-2 border-background',
			variant === 'selected' ? 'size-4' : 'size-3',
			dotClass[variant],
			className
		)}
	></div>
{:else}
	<!--
		AdvancedMarkerElement anchors content by its bottom-center, and a 45deg-rotated
		square's bounding box is bottom-centered on its tip, so the pointer lands exactly
		on the coordinate. Keep the pointer in normal flow so it stays part of that box.
		Shadows are the priciest thing to paint at scale, so keep them minimal.
	-->
	<div class={cn('flex cursor-pointer flex-col items-center', className)}>
		<div
			class={cn(
				'rounded-full border px-3 py-1 text-sm font-semibold whitespace-nowrap',
				variant === 'selected' ? 'scale-110 shadow-md' : 'shadow-sm',
				pillClass[variant]
			)}
		>
			{#if children}{@render children()}{:else}{label}{/if}
		</div>
		<div class={cn('-mt-1 size-2 rotate-45 border-r border-b', pillClass[variant])}></div>
	</div>
{/if}
