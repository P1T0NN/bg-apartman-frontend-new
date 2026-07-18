<script lang="ts">
	// TYPES
	import type { Attachment } from 'svelte/attachments';

	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// UTILS
	import { cn } from '@/utils/utils.js';
	// LUCIDE ICONS
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	let {
		expanded = $bindable(),
		description
	}: {
		expanded: boolean;
		description: string;
	} = $props();

	let isTruncated = $state(false);

	const clampClass = 'line-clamp-5';

	const measureTruncation: Attachment<HTMLParagraphElement> = (element) => {
		element.classList.add(clampClass);
		isTruncated = element.scrollHeight > element.clientHeight + 1;
		element.classList.remove(clampClass);

		if (!isTruncated) expanded = false;
	};
</script>

<div class="space-y-3">
	<h2 class="text-lg font-semibold tracking-tight">
		{m['AccommodationPage.AccommodationSummaryDescription.title']()}
	</h2>

	<div class="space-y-2">
		{#key description}
			<p
				{@attach measureTruncation}
				class={cn(
					'text-sm leading-relaxed whitespace-pre-line text-foreground/90',
					!expanded && clampClass
				)}
			>
				{description}
			</p>
		{/key}

		{#if isTruncated}
			<button
				type="button"
				onclick={() => (expanded = !expanded)}
				class="inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4 hover:text-foreground"
			>
				{#if expanded}
					Show less
				{:else}
					Show more
				{/if}

				<ChevronDownIcon
					class={cn('size-4 transition-transform', expanded && 'rotate-180')}
					aria-hidden="true"
				/>
			</button>
		{/if}
	</div>
</div>
