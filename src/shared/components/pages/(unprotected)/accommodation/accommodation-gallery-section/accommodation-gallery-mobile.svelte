<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import * as Carousel from '@/shared/components/ui/carousel/index.js';

	// TYPES
	import type { CarouselAPI } from '@/shared/components/ui/carousel/context.js';
	import type { typesAccommodationImage } from '@/features/accommodations/types/types';

	let {
		images,
		title,
		lightboxOpen = $bindable()
	}: {
		images: typesAccommodationImage[];
		title: string;
		lightboxOpen: boolean;
	} = $props();

	let api = $state<CarouselAPI>();
	let selectedIndex = $state(0);

	const hasThumbnails = $derived(images.length > 1);

	$effect(() => {
		if (!api) return;
		selectedIndex = api.selectedScrollSnap();
		const onSelect = () => (selectedIndex = api!.selectedScrollSnap());
		api.on('select', onSelect);
		return () => {
			api?.off('select', onSelect);
		};
	});
</script>

<div class="space-y-2 md:hidden">
	<div class="relative">
		<Carousel.Root setApi={(emblaApi) => (api = emblaApi)} opts={{ loop: true }} class="w-full">
			<Carousel.Content class="ml-0">
				{#each images as image, i (image.key)}
					<Carousel.Item class="pl-0">
						<button
							type="button"
							onclick={() => (lightboxOpen = true)}
							class="block w-full"
							aria-label={m['AccommodationPage.AccommodationGalleryDesktop.openPhoto']({
								index: i + 1
							})}
						>
							<img
								src={image.url}
								alt={image.alt ?? title}
								class="aspect-4/3 w-full rounded-xl object-cover"
								fetchpriority={i === 0 ? 'high' : 'auto'}
								loading={i === 0 ? 'eager' : 'lazy'}
							/>
						</button>
					</Carousel.Item>
				{/each}
			</Carousel.Content>
		</Carousel.Root>

		<span
			class="pointer-events-none absolute right-3 bottom-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm ring-1 ring-border"
		>
			{selectedIndex + 1} / {images.length}
		</span>
	</div>

	{#if hasThumbnails}
		<div
			class="flex gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
		>
			{#each images as image, i (image.key)}
				<button
					type="button"
					onclick={() => api?.scrollTo(i)}
					class={[
						'aspect-4/3 w-16 shrink-0 overflow-hidden rounded-md bg-muted ring-2 transition',
						i === selectedIndex ? 'ring-foreground' : 'ring-transparent'
					]}
					aria-label={m['AccommodationPage.AccommodationGalleryDesktop.ariaLabel']({
						index: i + 1,
						total: images.length
					})}
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
