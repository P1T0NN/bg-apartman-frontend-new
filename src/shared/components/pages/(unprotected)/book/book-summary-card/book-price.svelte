<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import { Separator } from '@/shared/components/ui/separator/index.js';

	// UTILS
	import { hasNightlyDiscount } from '@/features/accommodations/utils/accommodationPresentation';
	import { calculatePrice } from '@/shared/features/pricing/utils/calculatePrice';
	import { nightsBetween } from '@/shared/utils/dateUtils';
	import { formatCurrency, formatNights } from '@/utils/formatters';

	// LUCIDE ICONS
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';

	// TYPES
	import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';

	let {
		accommodation,
		checkIn,
		checkOut
	}: {
		accommodation: typesAccommodationEnriched;
		checkIn: string | null;
		checkOut: string | null;
	} = $props();

	const nights = $derived(nightsBetween(checkIn, checkOut));
	const quote = $derived(calculatePrice(accommodation, nights));
	const hasDates = $derived(nights > 0);
	const discounted = $derived(hasNightlyDiscount(accommodation));
</script>

<div class="space-y-4">
	<p class="text-sm font-semibold">{m['BookAccommodationPage.BookPrice.priceDetails']()}</p>

	{#if hasDates}
		<div class="space-y-3">
			<dl class="space-y-2.5 text-sm">
				<!-- Nightly subtotal. The struck original total (right column) makes the saving
				     read at a glance: "was X, now Y". -->
				<div class="flex items-baseline justify-between gap-3">
					<dt class="text-muted-foreground">
						{formatCurrency(quote.nightly)}
						<span class="text-muted-foreground/60">×</span>
						{formatNights(nights)}
					</dt>
					<dd class="flex items-baseline gap-1.5">
						{#if discounted}
							<span class="text-xs text-muted-foreground/60 tabular-nums line-through">
								{formatCurrency(accommodation.pricePerNight * nights)}
							</span>
						{/if}
						<span class="font-medium tabular-nums">{formatCurrency(quote.accommodationTotal)}</span>
					</dd>
				</div>

				{#if quote.cleaningFee > 0}
					<div class="flex items-baseline justify-between gap-3">
						<dt class="text-muted-foreground">
							{m['BookAccommodationPage.BookPrice.cleaningFee']()}
						</dt>
						<dd class="font-medium tabular-nums">{formatCurrency(quote.cleaningFee)}</dd>
					</div>
				{/if}
			</dl>

			<Separator />

			<!-- Total — the anchor of the card: biggest, boldest line so the eye lands here first. -->
			<div class="flex items-baseline justify-between gap-3">
				<span class="text-base font-semibold">{m['BookAccommodationPage.BookPrice.total']()}</span>
				<span class="text-xl font-bold tracking-tight tabular-nums"
					>{formatCurrency(quote.total)}</span
				>
			</div>
		</div>
	{:else}
		<!-- No dates yet: the hint leads into the nightly price, which sits on its own line —
		     big and bold — so "99 / night" registers instantly instead of hiding mid-sentence. -->
		<div class="rounded-xl bg-muted/40 p-4">
			<p class="flex items-center gap-2 text-sm text-muted-foreground">
				<CalendarDaysIcon class="size-4 shrink-0" aria-hidden="true" />
				{m['BookAccommodationPage.BookPrice.addDatesToSeePrice']()}
			</p>
			<p class="mt-2.5 flex items-baseline gap-1.5">
				<span class="text-2xl font-bold tracking-tight text-foreground">
					{formatCurrency(quote.nightly)}
				</span>
				<span class="text-sm font-medium text-muted-foreground">
					{m['BookAccommodationPage.BookPrice.perNight']()}
				</span>
			</p>
		</div>
	{/if}
</div>
