<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants';

	// COMPONENTS
	import { QualityImage } from '@/shared/components/ui/quality-image';
	import ToggleFavoriteButton from '@/features/favorites/components/toggle-favorite-button.svelte';
	import SuperhostBadge from '@/features/accommodations/components/superhost-badge.svelte';
	import NewAccommodationBadge from './new-accommodation-badge.svelte';
	import AccommodationCardBody from './accommodation-card-body.svelte';

	// UTILS
	import { cn } from '@/shared/utils/utils.js';
	import { appHref } from '@/shared/utils/app-navigation.js';

	// TYPES
	import type { SearchListing } from '@/features/accommodations/types/searchListing';
	import type { ClassValue } from 'clsx';

	let {
		listing,
		selected = false,
		onhover,
		id,
		class: className
	}: {
		listing: SearchListing;
		/** Draw the focus ring (its marker is hovered/clicked on the map). */
		selected?: boolean;
		/** Bubble hover up so the matching map marker can highlight. */
		onhover?: (id: string | null) => void;
		id?: string;
		class?: ClassValue;
	} = $props();

	const listingHref = $derived(
		appHref(UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION.replace(':slug', listing.slug))
	);

	const discountPercent = $derived(
		listing.originalPrice && listing.originalPrice > listing.pricePerNight
			? Math.round((1 - listing.pricePerNight / listing.originalPrice) * 100)
			: 0
	);
</script>

<article
	id={id ?? `listing-${listing.id}`}
	onpointerenter={() => onhover?.(listing.id)}
	onpointerleave={() => onhover?.(null)}
	class={cn(
		'group relative rounded-2xl ring-offset-2 ring-offset-background transition',

		selected && 'ring-2 ring-primary',

		className
	)}
>
	<a
		href={listingHref}
		data-sveltekit-preload-data="tap"
		class="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
	>
		<div class="relative aspect-4/3 overflow-hidden rounded-2xl bg-muted">
			<QualityImage
				src={listing.image.url}
				alt={listing.image.alt ?? listing.title}
				class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
			/>

			<!-- Scrim keeps the white badges + heart legible over bright photos. -->
			<div
				class="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/25 to-transparent"
			></div>

			{#if listing.isSuperhost}
				<SuperhostBadge variant="overlay" />
			{:else if listing.rating === undefined}
				<NewAccommodationBadge />
			{/if}

			{#if discountPercent}
				<span
					class="absolute bottom-3 left-3 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground shadow-sm"
				>
					-{discountPercent}%
				</span>
			{/if}
		</div>

		<AccommodationCardBody {listing} class="pt-2.5" />
	</a>

	<ToggleFavoriteButton apartmentId={listing.id} variant="overlay" />
</article>
