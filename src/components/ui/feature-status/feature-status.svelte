<script lang="ts" generics="TStatus extends string">
	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import { NativeTooltip } from '@/components/ui/native-tooltip/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { typesFeatureStatusProps } from './types';

	// LUCIDE ICONS
	import CircleHelpIcon from '@lucide/svelte/icons/circle-help';

	let {
		config,
		status,
		variant = 'badge',
		help,
		class: className
	}: typesFeatureStatusProps<TStatus> = $props();

	const tone = $derived(config[status]);
</script>

{#snippet statusEl()}
	{#if variant === 'badge'}
		<Badge class={cn('ring-1', tone.badgeClass, className)}>{tone.label}</Badge>
	{:else}
		<span class={cn('inline-flex items-center gap-1.5 text-xs font-medium', className)}>
			<span class={cn('size-2 shrink-0 rounded-full', tone.dotClass)} aria-hidden="true"></span>
			{tone.label}
		</span>
	{/if}
{/snippet}

{#if help}
	<span class="inline-flex items-center gap-1.5">
		{@render statusEl()}

		<NativeTooltip content={help.tooltip ?? 'Click to learn more'} class="inline-flex">
			<a
				href={help.href}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={help.ariaLabel}
				class="inline-flex rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			>
				<CircleHelpIcon class="size-4" aria-hidden="true" />
			</a>
		</NativeTooltip>
	</span>
{:else}
	{@render statusEl()}
{/if}
