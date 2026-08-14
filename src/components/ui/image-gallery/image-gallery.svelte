<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Carousel, CarouselContent, CarouselItem } from '@/shared/components/ui/carousel';
	import { Button } from '@/components/ui/button/index.js';

	// TYPES
	import type { CarouselAPI } from '@/shared/components/ui/carousel/context.js';
	import type { ImageGalleryImage } from './types';

	// LUCIDE ICONS
	import XIcon from '@lucide/svelte/icons/x';
	import Grid3x3Icon from '@lucide/svelte/icons/grid-3x3';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	let { images, title }: { images: ImageGalleryImage[]; title: string } = $props();

	let api = $state<CarouselAPI | undefined>();
	let selectedIndex = $state(0);
	let lightboxOpen = $state(false);

	// The horizontal thumbnail track — auto-scrolled to keep the active thumbnail in view.
	let thumbTrack = $state<HTMLElement | null>(null);

	const hasThumbnails = $derived(images.length > 1);

	// Embla drives the track; the counter badge + thumbnail highlight follow its selection.
	function onSelect() {
		if (!api) return;
		selectedIndex = api.selectedScrollSnap();
	}

	function onApiChange(next: CarouselAPI | undefined) {
		api?.off('select', onSelect);
		api = next;
		if (api) {
			api.on('select', onSelect);
			onSelect();
		}
	}

	function scrollTo(i: number) {
		api?.scrollTo(i);
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

	// Keep the active thumbnail in view as the selected image changes.
	$effect(() => {
		const idx = selectedIndex;
		if (!thumbTrack) return;
		thumbTrack
			.querySelector<HTMLElement>(`[data-thumb-index="${idx}"]`)
			?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') lightboxOpen = false;
	}}
/>

<div class="w-full space-y-2 md:space-y-3">
	<div class="relative">
		<Carousel opts={{ loop: true }} setApi={onApiChange} class="w-full">
			<CarouselContent class="ms-0">
				{#each images as image, i (image.key)}
					<CarouselItem class="ps-0">
						<button
							type="button"
							onclick={() => (lightboxOpen = true)}
							class="group relative block aspect-4/3 w-full overflow-hidden rounded-2xl bg-muted md:aspect-video"
							aria-label={m['ImageGallery.openPhotoFullscreen']({ index: i + 1 })}
						>
							<img
								src={image.url}
								alt={image.alt ?? title}
								class="size-full object-cover"
								fetchpriority={i === 0 ? 'high' : 'auto'}
								loading={i === 0 ? 'eager' : 'lazy'}
							/>
							<span class="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10"
							></span>
						</button>
					</CarouselItem>
				{/each}
			</CarouselContent>
		</Carousel>

		<span
			class="pointer-events-none absolute right-3 bottom-3 z-10 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm ring-1 ring-border md:hidden"
		>
			{selectedIndex + 1} / {images.length}
		</span>

		{#if hasThumbnails}
			<Button
				variant="outline"
				size="icon"
				class="absolute inset-y-0 start-3 z-10 my-auto hidden rounded-full bg-background/90 shadow-sm active:translate-y-0 md:inline-flex"
				onclick={() => api?.scrollPrev(true)}
				aria-label={m['ImageGallery.previousSlide']()}
			>
				<ChevronLeftIcon class="size-4" />
			</Button>

			<Button
				variant="outline"
				size="icon"
				class="absolute inset-y-0 end-3 z-10 my-auto hidden rounded-full bg-background/90 shadow-sm active:translate-y-0 md:inline-flex"
				onclick={() => api?.scrollNext(true)}
				aria-label={m['ImageGallery.nextSlide']()}
			>
				<ChevronRightIcon class="size-4" />
			</Button>

			<Button
				variant="outline"
				size="sm"
				class="absolute right-4 bottom-4 z-10 hidden bg-background shadow-sm md:inline-flex"
				onclick={() => (lightboxOpen = true)}
			>
				<Grid3x3Icon class="size-4" aria-hidden="true" />
				{m['ImageGallery.showAllPhotos']()}
			</Button>
		{/if}
	</div>

	{#if hasThumbnails}
		<div
			bind:this={thumbTrack}
			class="flex gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
		>
			{#each images as image, i (image.key)}
				<button
					type="button"
					onclick={() => scrollTo(i)}
					data-thumb-index={i}
					class={[
						'aspect-4/3 w-16 shrink-0 overflow-hidden rounded-lg bg-muted ring-2 transition md:w-28',
						i === selectedIndex ? 'ring-foreground' : 'ring-transparent hover:ring-border'
					]}
					aria-label={m['ImageGallery.viewPhotoOf']({ index: i + 1, total: images.length })}
					aria-current={i === selectedIndex}
				>
					<img
						src={image.url}
						alt={image.alt ?? title}
						class="size-full object-cover"
						loading="lazy"
					/>
				</button>
			{/each}
		</div>
	{/if}
</div>

{#if lightboxOpen}
	<div
		class="fixed inset-0 z-100 flex flex-col bg-background"
		role="dialog"
		aria-modal="true"
		aria-label={m['ImageGallery.photoGallery']({ title })}
	>
		<div
			class="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur"
		>
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={() => (lightboxOpen = false)}
				aria-label={m['ImageGallery.closeGallery']()}
			>
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
