<script lang="ts">
	// COMPONENTS
	import { Separator } from '@/shared/components/ui/separator/index.js';

	// UTILS
	import {
		accommodationTypeLabel,
		formatCurrency,
		formatDateRange,
		formatGuestsShort,
		hasNightlyDiscount,
		nightsBetween,
		priceQuote
	} from '@/features/accommodations/utils/accommodationPresentation';

	// TYPES
	import type { AccommodationDetail } from '@/features/accommodations/data/accommodationDummyData';

	let {
		accommodation,
		checkIn,
		checkOut,
		adults,
		children
	}: {
		accommodation: AccommodationDetail;
		checkIn: string | null;
		checkOut: string | null;
		adults: number;
		children: number;
	} = $props();

	const cover = $derived(accommodation.images[accommodation.coverImageIndex ?? 0] ?? accommodation.images[0]);
	const nights = $derived(nightsBetween(checkIn, checkOut));
	const quote = $derived(priceQuote(accommodation, nights));
	const hasDates = $derived(nights > 0);
</script>

<div class="space-y-5 rounded-2xl border p-5 sm:p-6">
	<!-- Listing -->
	<div class="flex gap-4">
		<img
			src={cover?.url}
			alt={cover?.alt ?? accommodation.title}
			class="size-20 shrink-0 rounded-xl object-cover ring-1 ring-border"
			loading="lazy"
		/>
		<div class="min-w-0 space-y-0.5">
			<p class="text-xs text-muted-foreground">
				{accommodationTypeLabel(accommodation.type)} in {accommodation.city}
			</p>
			<p class="truncate font-medium">{accommodation.title}</p>
			{#if accommodation.host.isSuperhost}
				<p class="text-xs text-muted-foreground">Superhost · {accommodation.host.name}</p>
			{/if}
		</div>
	</div>

	<Separator />

	<!-- Trip recap -->
	<dl class="space-y-2 text-sm">
		<div class="flex items-center justify-between gap-3">
			<dt class="text-muted-foreground">Dates</dt>
			<dd class="text-right font-medium">
				{checkIn && checkOut ? formatDateRange(checkIn, checkOut) : '—'}
			</dd>
		</div>
		<div class="flex items-center justify-between gap-3">
			<dt class="text-muted-foreground">Guests</dt>
			<dd class="text-right font-medium">{formatGuestsShort(adults, children)}</dd>
		</div>
	</dl>

	<Separator />

	<!-- Price -->
	<div class="space-y-3">
		<p class="font-semibold">Price details</p>
		{#if hasDates}
			<div class="space-y-2.5 text-sm">
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">
						{formatCurrency(quote.nightly)} × {nights}
						{nights === 1 ? 'night' : 'nights'}
						{#if hasNightlyDiscount(accommodation)}
							<span class="text-xs line-through">{formatCurrency(accommodation.pricePerNight)}</span>
						{/if}
					</span>
					<span class="tabular-nums">{formatCurrency(quote.accommodationTotal)}</span>
				</div>
				{#if quote.cleaningFee > 0}
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Cleaning fee</span>
						<span class="tabular-nums">{formatCurrency(quote.cleaningFee)}</span>
					</div>
				{/if}
				<Separator />
				<div class="flex items-center justify-between text-base font-semibold">
					<span>Total <span class="text-sm font-normal text-muted-foreground">EUR</span></span>
					<span class="tabular-nums">{formatCurrency(quote.total)}</span>
				</div>
			</div>
		{:else}
			<p class="text-sm text-muted-foreground">
				Add your dates to see the full price — from
				<span class="font-medium text-foreground">{formatCurrency(quote.nightly)}</span> / night.
			</p>
		{/if}
	</div>
</div>
