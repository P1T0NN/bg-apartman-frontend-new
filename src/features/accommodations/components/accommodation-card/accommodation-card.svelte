<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints';

	// COMPONENTS
	import { QualityImage } from '@/shared/components/ui/quality-image';
	import ToggleFavoriteButton from '@/features/favorites/components/toggle-favorite-button.svelte';
	import SuperhostBadge from '@/features/accommodations/components/superhost-badge.svelte';
	import NewAccommodationBadge from './new-accommodation-badge.svelte';
	import AccommodationCardBody from './accommodation-card-body.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { appHref } from '@/utils/app-navigation.js';

	// TYPES
	import type { SearchAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';
	import type { ClassValue } from 'clsx';

	// LUCIDE ICONS
	import StarIcon from '@lucide/svelte/icons/star';

	let {
		accommodation,
		selected = false,
		featured = false,
		boxed = false,
		onhover,
		id,
		class: className
	}: {
		accommodation: SearchAccommodation;
		/** Draw the focus ring (its marker is hovered/clicked on the map). */
		selected?: boolean;
		/** Show the "Featured" star badge (top-left, takes priority over superhost/new). */
		featured?: boolean;
		/** Wrap the card in a bordered surface (border + bg-card + shadow) instead of the
		    default bare image-first layout. Use where a card sits on the page background. */
		boxed?: boolean;
		/** Bubble hover up so the matching map marker can highlight. */
		onhover?: (id: string | null) => void;
		id?: string;
		class?: ClassValue;
	} = $props();

	const accommodationHref = $derived(
		appHref(UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION.replace(':slug', accommodation.slug))
	);

	const discountPercent = $derived(
		accommodation.originalPrice && accommodation.originalPrice > accommodation.pricePerNight
			? Math.round((1 - accommodation.pricePerNight / accommodation.originalPrice) * 100)
			: 0
	);
</script>

<article
	id={id ?? `accommodation-${accommodation.id}`}
	onpointerenter={() => onhover?.(accommodation.id)}
	onpointerleave={() => onhover?.(null)}
	class={cn(
		'group relative rounded-2xl ring-offset-2 ring-offset-background transition',
		boxed && 'overflow-hidden border border-border/60 bg-card shadow-sm hover:shadow-md',
		selected && 'ring-2 ring-primary',
		className
	)}
>
	<a
		href={accommodationHref}
		data-sveltekit-preload-data="tap"
		class="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
	>
		<div
			class={cn(
				'relative aspect-4/3 overflow-hidden bg-muted',
				boxed ? 'rounded-t-2xl' : 'rounded-2xl'
			)}
		>
			<QualityImage
				src={accommodation.image.url}
				alt={accommodation.image.alt ?? accommodation.title}
				class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
			/>

			<!-- Scrim keeps the white badges + heart legible over bright photos. -->
			<div
				class="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-black/25 to-transparent"
			></div>

			{#if featured}
				<span
					class="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm"
				>
					<StarIcon class="size-3 fill-current" aria-hidden="true" />
					Featured
				</span>
			{:else if accommodation.isSuperhost}
				<SuperhostBadge variant="overlay" />
			{:else if accommodation.rating === undefined}
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

		<AccommodationCardBody {accommodation} class={boxed ? 'px-3.5 pt-3 pb-3.5' : 'pt-2.5'} />
	</a>

	<ToggleFavoriteButton apartmentId={accommodation.id} variant="overlay" />
</article>
