<script lang="ts">
	// COMPONENTS
	import AccommodationGalleryMobile from './accommodation-gallery-mobile.svelte';
	import AccommodationGalleryDesktop from './accommodation-gallery-desktop.svelte';
	import AccommodationGalleryLightbox from './accommodation-gallery-lightbox.svelte';

	// TYPES
	import type { typesAccommodationImage } from '@/shared/features/accommodation/types/accommodationTypes';

	let { images, title }: { images: typesAccommodationImage[]; title: string } = $props();

	let lightboxOpen = $state(false);

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

<AccommodationGalleryMobile {images} {title} bind:lightboxOpen />

<AccommodationGalleryDesktop {images} {title} bind:lightboxOpen />

{#if lightboxOpen}
	<AccommodationGalleryLightbox {images} {title} bind:lightboxOpen />
{/if}
