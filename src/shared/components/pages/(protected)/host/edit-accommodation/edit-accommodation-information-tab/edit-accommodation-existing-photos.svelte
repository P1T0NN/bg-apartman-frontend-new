<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// LUCIDE ICONS
	import XIcon from '@lucide/svelte/icons/x';
	import ImageOffIcon from '@lucide/svelte/icons/image-off';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	type ApartmentImage = Doc<'apartments'>['images'][number];

	let {
		images,
		keepKeys,
		setValue,
		invalid = false
	}: {
		/** All images currently stored on the listing. */
		images: ApartmentImage[];
		/** Keys the host is keeping (the form value). */
		keepKeys: string[];
		setValue: (next: string[]) => void;
		/** Outline the area in destructive colour (combined photo count below the minimum). */
		invalid?: boolean;
	} = $props();

	// Current photos in display order, minus any the host already removed this session.
	const visible = $derived(
		[...images].sort((a, b) => a.order - b.order).filter((image) => keepKeys.includes(image.key))
	);

	function remove(key: string) {
		setValue(keepKeys.filter((k) => k !== key));
	}
</script>

{#if visible.length === 0}
	<div
		class={cn(
			'flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground',
			invalid && 'border-destructive bg-destructive/5 text-destructive'
		)}
	>
		<ImageOffIcon class="size-4" aria-hidden="true" />
		No current photos. Upload some below.
	</div>
{:else}
	<div class={cn('rounded-xl', invalid && 'p-2 ring-2 ring-destructive/60')}>
		<div class="grid grid-cols-3 gap-3 sm:grid-cols-4">
			{#each visible as image (image.key)}
				<div class="relative aspect-square overflow-hidden rounded-lg ring-1 ring-border">
					<img
						src={image.url}
						alt={image.alt ?? ''}
						class="size-full object-cover"
						loading="lazy"
					/>
					<button
						type="button"
						onclick={() => remove(image.key)}
						aria-label="Remove photo"
						title="Remove photo"
						class="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-background/80 text-foreground ring-1 ring-border backdrop-blur transition hover:bg-destructive/10 hover:text-destructive"
					>
						<XIcon class="size-3.5" />
					</button>
				</div>
			{/each}
		</div>
	</div>
{/if}
