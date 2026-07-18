<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';

	// TYPES
	import type { typesAccommodationImage } from '@/shared/features/accommodation/types/accommodationTypes';

	// LUCIDE ICONS
	import Grid3x3Icon from '@lucide/svelte/icons/grid-3x3';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	let {
		images,
		title,
		lightboxOpen = $bindable()
	}: {
		images: typesAccommodationImage[];
		title: string;
		lightboxOpen: boolean;
	} = $props();

	// ponytail: CSS scroll-snap instead of embla — arrows wrap around manually, rest is native.
	let track = $state<HTMLElement | null>(null);
	let selectedIndex = $state(0);

	const hasThumbnails = $derived(images.length > 1);

	function onScroll() {
		if (!track) return;
		selectedIndex = Math.round(track.scrollLeft / track.clientWidth);
	}

	function scrollTo(i: number) {
		// Wrap around so the arrows behave like the old looping carousel.
		const next = (i + images.length) % images.length;
		track?.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
	}
</script>

<div class="hidden w-full max-w-2xl space-y-3 md:block">
	<div class="relative w-full">
		<div
			bind:this={track}
			onscroll={onScroll}
			class="flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
		>
			{#each images as image, i (image.key)}
				<div class="w-full shrink-0 snap-start">
					<button
						type="button"
						onclick={() => (lightboxOpen = true)}
						class="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-muted"
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
				</div>
			{/each}
		</div>

		{#if hasThumbnails}
			<Button
				variant="outline"
				size="icon"
				class="absolute start-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 shadow-sm"
				onclick={() => scrollTo(selectedIndex - 1)}
				aria-label="Previous slide"
			>
				<ChevronLeftIcon class="size-4" />
			</Button>
			<Button
				variant="outline"
				size="icon"
				class="absolute end-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 shadow-sm"
				onclick={() => scrollTo(selectedIndex + 1)}
				aria-label="Next slide"
			>
				<ChevronRightIcon class="size-4" />
			</Button>
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
	</div>

	{#if hasThumbnails}
		<div
			class="flex gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
		>
			{#each images as image, i (image.key)}
				<button
					type="button"
					onclick={() => scrollTo(i)}
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
