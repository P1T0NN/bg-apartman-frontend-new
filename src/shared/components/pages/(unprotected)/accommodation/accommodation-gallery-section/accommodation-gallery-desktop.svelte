<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';
	import * as Carousel from '@/shared/components/ui/carousel/index.js';

	// TYPES
	import type { CarouselAPI } from '@/shared/components/ui/carousel/context.js';
	import type { typesAccommodationImage } from '@/shared/features/accommodation/types/accommodationTypes';

	// LUCIDE ICONS
	import Grid3x3Icon from '@lucide/svelte/icons/grid-3x3';

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

<div class="hidden w-full max-w-2xl space-y-3 md:block">
	<Carousel.Root setApi={(emblaApi) => (api = emblaApi)} opts={{ loop: true }} class="w-full">
		<Carousel.Content class="ml-0">
			{#each images as image, i (image.key)}
				<Carousel.Item class="pl-0">
					<button
						type="button"
						onclick={() => (lightboxOpen = true)}
						class="group block aspect-video w-full overflow-hidden rounded-2xl bg-muted"
						aria-label={m['AccommodationPage.AccommodationGalleryDesktop.openPhoto']({
							index: i + 1
						})}
					>
						<img
							src={image.url}
							alt={image.alt ?? title}
							class="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
							fetchpriority={i === 0 ? 'high' : 'auto'}
							loading={i === 0 ? 'eager' : 'lazy'}
						/>
						<span class="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10"
						></span>
					</button>
				</Carousel.Item>
			{/each}
		</Carousel.Content>

		{#if hasThumbnails}
			<Carousel.Previous class="start-3 bg-background/90 shadow-sm" />
			<Carousel.Next class="end-3 bg-background/90 shadow-sm" />
		{/if}

		<Button
			variant="outline"
			size="sm"
			class="absolute right-4 bottom-4 bg-background shadow-sm"
			onclick={() => (lightboxOpen = true)}
		>
			<Grid3x3Icon class="size-4" aria-hidden="true" />
			{m['AccommodationPage.AccommodationGalleryDesktop.showAllPhotos']()}
		</Button>
	</Carousel.Root>

	{#if hasThumbnails}
		<div
			class="flex gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
		>
			{#each images as image, i (image.key)}
				<button
					type="button"
					onclick={() => api?.scrollTo(i)}
					class={[
						'aspect-4/3 w-28 shrink-0 overflow-hidden rounded-lg bg-muted ring-2 transition',
						i === selectedIndex ? 'ring-foreground' : 'ring-transparent hover:ring-border'
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
