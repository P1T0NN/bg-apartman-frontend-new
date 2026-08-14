<script lang="ts">
	import { m } from '@/paraglide/messages';

	// COMPONENTS
	import DiscountedPrice from '@/shared/features/pricing/components/discounted-price.svelte';

	// UTILS
	import { accommodationTypeLabel } from '@/features/accommodations/utils/accommodationPresentation';
	import { formatGuests, formatBedrooms, formatBathrooms } from '@/utils/formatters';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { SearchAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';
	import type { ClassValue } from 'clsx';
	import type { Snippet } from 'svelte';

	// LUCIDE ICONS
	import StarIcon from '@lucide/svelte/icons/star';

	let {
		accommodation,
		class: className,
		actions
	}: {
		accommodation: SearchAccommodation;
		class?: ClassValue;
		/** Renders beside the price row (e.g. map popup "View" button). */
		actions?: Snippet;
	} = $props();
</script>

<div class={cn('space-y-0.5', actions && 'flex min-h-0 flex-1 flex-col', className)}>
	<div class="flex items-start justify-between gap-2">
		<h3 class="truncate text-sm font-medium">{accommodation.title}</h3>

		{#if accommodation.rating !== undefined}
			<span class="flex shrink-0 items-center gap-1 text-sm">
				<StarIcon class="size-3.5 fill-current text-primary" aria-hidden="true" />
				{accommodation.rating.toFixed(2)}
				{#if accommodation.reviewCount !== undefined}
					<span class="text-muted-foreground">({accommodation.reviewCount})</span>
				{/if}
			</span>
		{/if}
	</div>

	<p class="truncate text-sm text-muted-foreground">
		{m['AccommodationsFeature.AccommodationCard.AccommodationCardBody.typeInCity']({
			type: accommodationTypeLabel(accommodation.type),
			city: accommodation.city
		})}
	</p>

	<p class="truncate text-sm text-muted-foreground">
		{formatBedrooms(accommodation.bedrooms)} · {formatBathrooms(accommodation.bathrooms)} · {formatGuests(
			accommodation.maxGuests
		)}
	</p>

	{#if actions}
		<div class="mt-auto flex items-end justify-between gap-2 pt-2">
			<p class="text-sm">
				<DiscountedPrice
					original={accommodation.originalPrice}
					price={accommodation.pricePerNight}
				/>
				<span class="text-muted-foreground">{m['AccommodationsFeature.AccommodationCard.AccommodationCardBody.night']()}</span>
			</p>

			{@render actions()}
		</div>
	{:else}
		<p class="pt-0.5 text-sm">
			<DiscountedPrice original={accommodation.originalPrice} price={accommodation.pricePerNight} />
			<span class="text-muted-foreground">{m['AccommodationsFeature.AccommodationCard.AccommodationCardBody.night']()}</span>
		</p>
	{/if}
</div>
