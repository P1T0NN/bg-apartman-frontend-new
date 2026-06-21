<script lang="ts">
	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';

	// LUCIDE ICONS
	import Grid3x3Icon from '@lucide/svelte/icons/grid-3x3';
	import XIcon from '@lucide/svelte/icons/x';

	// TYPES
	import type { AccommodationImage } from '@/features/accommodations/data/accommodationDummyData';

	let { images, title }: { images: AccommodationImage[]; title: string } = $props();

	let lightboxOpen = $state(false);

	// Up to five photos drive the hero mosaic; the rest live in the lightbox.
	const mosaic = $derived(images.slice(0, 5));

	function open() {
		lightboxOpen = true;
	}

	// Lock the page behind the lightbox so only the photos scroll.
	$effect(() => {
		if (!lightboxOpen) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previous;
		};
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') lightboxOpen = false;
	}}
/>

<!-- Mobile: single hero -->
<div class="relative md:hidden">
	<button type="button" onclick={open} class="block w-full">
		<img
			src={images[0]?.url}
			alt={images[0]?.alt ?? title}
			class="aspect-[4/3] w-full rounded-xl object-cover"
			fetchpriority="high"
		/>
	</button>
	<span
		class="pointer-events-none absolute bottom-3 right-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm ring-1 ring-border"
	>
		1 / {images.length}
	</span>
</div>

<!-- Desktop: 1 large + 4 small mosaic -->
<div class="relative hidden md:block">
	<div class="grid h-[26rem] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl">
		{#each mosaic as image, i (image.key)}
			<button
				type="button"
				onclick={open}
				class={[
					'group relative overflow-hidden bg-muted',
					i === 0 && 'col-span-2 row-span-2'
				]}
				aria-label={`View photo ${i + 1} of ${images.length}`}
			>
				<img
					src={image.url}
					alt={image.alt ?? title}
					class="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
					fetchpriority={i === 0 ? 'high' : 'auto'}
					loading={i === 0 ? 'eager' : 'lazy'}
				/>
				<span class="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10"></span>
			</button>
		{/each}
	</div>

	<Button
		variant="outline"
		size="sm"
		class="absolute bottom-4 right-4 bg-background shadow-sm"
		onclick={open}
	>
		<Grid3x3Icon class="size-4" aria-hidden="true" />
		Show all photos
	</Button>
</div>

<!-- Lightbox -->
{#if lightboxOpen}
	<div
		class="fixed inset-0 z-[100] flex flex-col bg-background"
		role="dialog"
		aria-modal="true"
		aria-label={`${title} — photo gallery`}
	>
		<div class="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur">
			<Button variant="ghost" size="icon-sm" onclick={() => (lightboxOpen = false)} aria-label="Close gallery">
				<XIcon />
			</Button>
			<p class="text-sm font-medium">{title}</p>
			<span class="w-7"></span>
		</div>

		<div class="flex-1 overflow-y-auto">
			<div class="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-6">
				{#each images as image (image.key)}
					<figure class="space-y-1.5">
						<img
							src={image.url}
							alt={image.alt ?? title}
							class="w-full rounded-xl object-cover"
							loading="lazy"
						/>
						{#if image.alt}
							<figcaption class="text-center text-xs text-muted-foreground">{image.alt}</figcaption>
						{/if}
					</figure>
				{/each}
			</div>
		</div>
	</div>
{/if}
