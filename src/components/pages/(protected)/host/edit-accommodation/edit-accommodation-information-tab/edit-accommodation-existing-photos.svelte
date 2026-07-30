<script lang="ts">
	// COMPONENTS
	import UploadFileItemMultiple from '@/features/uploadFile/components/upload-file-multiple/upload-file-item-multiple.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	// LUCIDE ICONS
	import ImageOffIcon from '@lucide/svelte/icons/image-off';

	type ApartmentImage = Doc<'apartments'>['images'][number];

	let {
		images,
		keepKeys,
		setValue,
		invalid = false
	}: {
		/** All images currently stored on the accommodation. */
		images: ApartmentImage[];
		/** Keys the host is keeping (the form value). */
		keepKeys: string[];
		setValue: (next: string[]) => void;
		/** Outline the area in destructive colour (combined photo count below the minimum). */
		invalid?: boolean;
	} = $props();

	// Current photos in `keepKeys` order (that order is what the update mutation
	// persists, so visible[0] is the cover), minus any removed this session.
	const visible = $derived(
		keepKeys
			.map((key) => images.find((image) => image.key === key))
			.filter((image): image is ApartmentImage => image !== undefined)
	);
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
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{#each visible as image, i (image.key)}
				<UploadFileItemMultiple
					previewUrl={image.url}
					name={image.alt ?? 'photo'}
					hasCoverImage
					isCover={i === 0}
					onSetCover={() => setValue([image.key, ...keepKeys.filter((k) => k !== image.key)])}
					onRemove={() => setValue(keepKeys.filter((k) => k !== image.key))}
				/>
			{/each}
		</div>
	</div>
{/if}
