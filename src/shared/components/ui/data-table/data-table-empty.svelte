<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import { Card } from '@/shared/components/ui/card/index.js';

	// UTILS
	import { cn } from '@/shared/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';

	// LUCIDE ICONS
	import InboxIcon from '@lucide/svelte/icons/inbox';

	type Props = {
		class?: string;
		title?: string;
		description?: string;
		children?: Snippet;
	};

	let {
		class: className,
		title = m['DataTable.emptyTitle'](),
		description = m['DataTable.emptyDescription'](),
		children
	}: Props = $props();
</script>

<Card
	data-slot="data-table-empty"
	class={cn(
		'items-center justify-center gap-3 px-6 py-12 text-center',
		className
	)}
	role="status"
>
	<span
		class="bg-muted/50 text-muted-foreground ring-border inline-flex size-12 items-center justify-center rounded-full ring-1"
		aria-hidden="true"
	>
		<InboxIcon class="size-6 opacity-80" />
	</span>
	<div class="max-w-sm space-y-1">
		<p class="text-foreground text-sm font-medium">{title}</p>
		<p class="text-muted-foreground text-sm leading-relaxed">{description}</p>
	</div>
	{#if children}
		<div class="pt-1">{@render children()}</div>
	{/if}
</Card>
