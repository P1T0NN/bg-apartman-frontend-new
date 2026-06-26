<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// UTILS
	import { cn } from '@/shared/utils/utils.js';

	// LUCIDE ICONS
	import AwardIcon from '@lucide/svelte/icons/award';

	let {
		variant = 'pill',
		class: className
	}: {
		/** Amber pill (overview), image overlay (search card), host subtitle, or inline label. */
		variant?: 'pill' | 'overlay' | 'subtitle' | 'inline';
		class?: string;
	} = $props();
</script>

{#if variant === 'overlay'}
	<span
		class={cn(
			'absolute top-3 left-3 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium shadow-sm',
			className
		)}
	>
		{m['SuperhostBadge.superhost']()}
	</span>
{:else if variant === 'subtitle'}
	<p class={cn('flex items-center gap-1.5 text-sm text-muted-foreground', className)}>
		<AwardIcon class="size-4" aria-hidden="true" />
		{m['SuperhostBadge.superhost']()}
	</p>
{:else if variant === 'inline'}
	<span class={cn('inline', className)}>{m['SuperhostBadge.superhost']()}</span>
{:else}
	<span
		class={cn(
			'flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300',
			className
		)}
	>
		<AwardIcon class="size-3.5" aria-hidden="true" />
		{m['SuperhostBadge.superhost']()}
	</span>
{/if}
