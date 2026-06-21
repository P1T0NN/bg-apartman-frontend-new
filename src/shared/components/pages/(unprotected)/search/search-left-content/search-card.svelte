<script lang="ts">
	// COMPONENTS
	import { QualityImage } from '@/shared/components/ui/quality-image';

	// UTILS
	import { cn } from '@/shared/utils/utils.js';
	import { appHref } from '@/shared/utils/app-navigation.js';
	import {
		formatCurrency,
		accommodationTypeLabel
	} from '@/features/accommodations/utils/accommodationPresentation';

	// TYPES
	import type { SearchListing } from '@/features/accommodations/data/searchResultsDummyData';

	// LUCIDE ICONS
	import StarIcon from '@lucide/svelte/icons/star';
	import HeartIcon from '@lucide/svelte/icons/heart';

	let {
		listing,
		selected = false,
		onhover
	}: {
		listing: SearchListing;
		/** Draw the focus ring (its marker is hovered/clicked on the map). */
		selected?: boolean;
		/** Bubble hover up so the matching map marker can highlight. */
		onhover?: (id: string | null) => void;
	} = $props();

	let saved = $state(false);
</script>

<!-- The whole card is the link — one obvious tap target, nothing competing. -->
<a
	id={`listing-${listing.id}`}
	href={appHref(`/accommodation/${listing.slug}`)}
	data-sveltekit-preload-data="tap"
	onpointerenter={() => onhover?.(listing.id)}
	onpointerleave={() => onhover?.(null)}
	class={cn(
		'group block rounded-2xl ring-offset-2 ring-offset-background transition outline-none focus-visible:ring-2 focus-visible:ring-ring',
		selected && 'ring-2 ring-primary'
	)}
>
	<div class="relative aspect-4/3 overflow-hidden rounded-2xl bg-muted">
		<QualityImage
			src={listing.image.url}
			alt={listing.image.alt ?? listing.title}
			class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
		/>

		{#if listing.isSuperhost}
			<span
				class="absolute top-3 left-3 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium shadow-sm"
			>
				Superhost
			</span>
		{/if}

		<button
			type="button"
			aria-label={saved ? 'Remove from saved' : 'Save'}
			aria-pressed={saved}
			onclick={(e) => {
				e.preventDefault(); // don't follow the card link
				saved = !saved;
			}}
			class="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-background/70 text-foreground backdrop-blur transition hover:bg-background"
		>
			<HeartIcon class={cn('size-4', saved && 'fill-red-500 text-red-500')} aria-hidden="true" />
		</button>
	</div>

	<div class="space-y-0.5 pt-2.5">
		<div class="flex items-start justify-between gap-2">
			<h3 class="truncate text-sm font-medium">{listing.title}</h3>
			<span class="flex shrink-0 items-center gap-1 text-sm">
				<StarIcon class="size-3.5 fill-current" aria-hidden="true" />
				{listing.rating.toFixed(2)}
			</span>
		</div>

		<p class="truncate text-sm text-muted-foreground">
			{accommodationTypeLabel(listing.type)} in {listing.city} · {listing.maxGuests} guests
		</p>

		<p class="pt-0.5 text-sm">
			{#if listing.originalPrice}
				<span class="text-muted-foreground line-through">{formatCurrency(listing.originalPrice)}</span>
			{/if}
			<span class="font-semibold">{formatCurrency(listing.pricePerNight)}</span>
			<span class="text-muted-foreground">/ night</span>
		</p>
	</div>
</a>
