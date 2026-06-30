<script lang="ts">
	// UTILS
	import { accommodationTypeLabel } from '@/features/accommodations/utils/accommodationPresentation';
	import { formatCurrency, formatGuests, formatBedrooms, formatBathrooms } from '@/utils/formatters';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { SearchListing } from '@/shared/features/accommodation/types/accommodationTypes';
	import type { ClassValue } from 'clsx';
	import type { Snippet } from 'svelte';

	// LUCIDE ICONS
	import StarIcon from '@lucide/svelte/icons/star';

	let {
		listing,
		class: className,
		actions
	}: {
		listing: SearchListing;
		class?: ClassValue;
		/** Renders beside the price row (e.g. map popup "View" button). */
		actions?: Snippet;
	} = $props();
</script>

<div class={cn('space-y-0.5', actions && 'flex min-h-0 flex-1 flex-col', className)}>
	<div class="flex items-start justify-between gap-2">

		<h3 class="truncate text-sm font-medium">{listing.title}</h3>

		{#if listing.rating !== undefined}
			<span class="flex shrink-0 items-center gap-1 text-sm">
				<StarIcon class="size-3.5 fill-current" aria-hidden="true" />
				{listing.rating.toFixed(2)}
				{#if listing.reviewCount !== undefined}
					<span class="text-muted-foreground">({listing.reviewCount})</span>
				{/if}
			</span>
		{/if}
	</div>

	<p class="truncate text-sm text-muted-foreground">
		{accommodationTypeLabel(listing.type)} in {listing.city}
	</p>

	<p class="truncate text-sm text-muted-foreground">
		{formatBedrooms(listing.bedrooms)} · {formatBathrooms(listing.bathrooms)} · {formatGuests(listing.maxGuests)}
	</p>

	{#if actions}
		<div class="mt-auto flex items-end justify-between gap-2 pt-2">
			<p class="text-sm">
				{#if listing.originalPrice}
					<span class="text-muted-foreground line-through">{formatCurrency(listing.originalPrice)}</span>
				{/if}

				<span class="font-semibold">{formatCurrency(listing.pricePerNight)}</span>
				<span class="text-muted-foreground">/ night</span>
			</p>

			{@render actions()}
		</div>
	{:else}
		<p class="pt-0.5 text-sm">
			{#if listing.originalPrice}
				<span class="text-muted-foreground line-through">{formatCurrency(listing.originalPrice)}</span>
			{/if}
			
			<span class="font-semibold">{formatCurrency(listing.pricePerNight)}</span>
			<span class="text-muted-foreground">/ night</span>
		</p>
	{/if}
</div>
