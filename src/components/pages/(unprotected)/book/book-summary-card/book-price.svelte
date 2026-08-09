<script lang="ts">
	// COMPONENTS
	import { Separator } from '@/components/ui/separator/index.js';

	// UTILS
	import { hasNightlyDiscount } from '@/features/accommodations/utils/accommodationPresentation';
	import { calculatePrice } from '@/shared/features/pricing/utils/calculatePrice';
	import { nightsBetween } from '@/shared/utils/dateUtils';
	import { formatCurrency, formatNights } from '@/utils/formatters';

	// LUCIDE ICONS
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import PercentIcon from '@lucide/svelte/icons/percent';
	import SprayCanIcon from '@lucide/svelte/icons/spray-can';

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
	const quote = $derived(calculatePrice(accommodation, checkIn, checkOut));
	const hasDates = $derived(nights > 0);
	const discounted = $derived(hasNightlyDiscount(accommodation));
	// Whole-percent saving off the base rate, shown next to the struck price (e.g. −20%).
	const discountPercent = $derived(
		discounted ? Math.round((1 - quote.nightly / accommodation.pricePerNight) * 100) : 0
	);
	// A stay with Fri/Sat nights splits into two rate buckets; the base bucket carries the
	// discount strike, the weekend bucket never does (its rate already is the weekend price).
	const weekendPremium = $derived(quote.weekendPremium ?? 0);
	const weekendActive = $derived(weekendPremium > 0 && quote.weekendNights > 0);
	const regularNights = $derived(quote.nights - quote.weekendNights);

	// The listing's rate structure, shown before dates are picked: one row per component that
	// actually applies (weekend rate, weekly discount, cleaning fee). The nightly discount is
	// deliberately NOT here — it lives in the hero line itself as a struck original + badge, so
	// the actual price stays the anchor instead of competing with a second, larger number.
	// All lucide icons share one Component<LucideProps> type, so `typeof CalendarDaysIcon` is exact.
	type PricingFeature = {
		icon: typeof CalendarDaysIcon;
		label: string;
		value: string;
	};

	const pricingFeatures = $derived.by<PricingFeature[]>(() => {
		const features: PricingFeature[] = [];
		if (accommodation.weekendPremium && accommodation.weekendPremium > 0) {
			features.push({
				icon: CalendarDaysIcon,
				label: 'Weekend rate (Fri–Sat)',
				value: `${formatCurrency(accommodation.weekendPremium)}/night`
			});
		}
		if (accommodation.weeklyDiscount && accommodation.weeklyDiscount > 0) {
			features.push({
				icon: PercentIcon,
				label: 'Weekly discount',
				value: `−${accommodation.weeklyDiscount}% off stays of 7+ nights`
			});
		}
		if (accommodation.cleaningFee && accommodation.cleaningFee > 0) {
			features.push({
				icon: SprayCanIcon,
				label: 'Cleaning fee',
				value: `${formatCurrency(accommodation.cleaningFee)}, once per stay`
			});
		}
		return features;
	});

	// The additions that sit between the per-night math and the total. When any exist, they get
	// a hairline above them so they read as "added on top of the nights", not part of the rate.
	const hasAdjustments = $derived(
		quote.lengthDiscount > 0 || quote.cleaningFee > 0 || quote.platformFee > 0
	);
</script>

<div class="space-y-4">
	<p class="text-sm font-semibold">Price details</p>

	{#if hasDates}
		<div class="space-y-3">
			<dl class="space-y-2.5 text-sm">
				<!-- Nightly subtotal, split into its rate buckets when a Fri/Sat override applies.
				     The struck original total (right column) makes the saving read at a glance:
				     "was X, now Y" — weekend nights were already the weekend price, so only the
				     base nights carry the strike. -->
				{#if weekendActive}
					{#if regularNights > 0}
						<div class="flex items-baseline justify-between gap-3">
							<dt class="text-muted-foreground">
								{formatCurrency(quote.nightly)}
								<span class="text-muted-foreground/60">×</span>
								{formatNights(regularNights)}
							</dt>
							<dd class="flex items-baseline gap-1.5">
								{#if discounted}
									<span class="text-xs text-muted-foreground/60 tabular-nums line-through">
										{formatCurrency(accommodation.pricePerNight * regularNights)}
									</span>
									<span class="text-xs font-semibold text-destructive tabular-nums"
										>−{discountPercent}%</span
									>
								{/if}
								<span class="font-medium tabular-nums"
									>{formatCurrency(quote.nightly * regularNights)}</span
								>
							</dd>
						</div>
					{/if}
					<div class="flex items-baseline justify-between gap-3">
						<dt class="text-muted-foreground">
							{formatCurrency(weekendPremium)}
							<span class="text-muted-foreground/60">×</span>
							{formatNights(quote.weekendNights)}
						</dt>
						<dd class="font-medium tabular-nums">
							{formatCurrency(weekendPremium * quote.weekendNights)}
						</dd>
					</div>
				{:else}
					<div class="flex items-baseline justify-between gap-3">
						<dt class="text-muted-foreground">
							{formatCurrency(quote.nightly)}
							<span class="text-muted-foreground/60">×</span>
							{formatNights(quote.nights)}
						</dt>
						<dd class="flex items-baseline gap-1.5">
							{#if discounted}
								<span class="text-xs text-muted-foreground/60 tabular-nums line-through">
									{formatCurrency(accommodation.pricePerNight * quote.nights)}
								</span>
								<span class="text-xs font-semibold text-destructive tabular-nums"
									>−{discountPercent}%</span
								>
							{/if}
							<span class="font-medium tabular-nums"
								>{formatCurrency(quote.accommodationTotal)}</span
							>
						</dd>
					</div>
				{/if}
			</dl>

			{#if hasAdjustments}
				<!-- The additions that sit on top of the nightly math, grouped under a hairline so
				     they read as "added to this stay", not part of the nightly rate. -->
				<dl class="space-y-2.5 border-t border-border pt-3 text-sm">
					{#if quote.lengthDiscount > 0}
						<div class="flex items-baseline justify-between gap-3">
							<dt class="text-muted-foreground">
								Weekly discount ({quote.lengthDiscountPercent}%)
							</dt>
							<dd class="font-medium tabular-nums">−{formatCurrency(quote.lengthDiscount)}</dd>
						</div>
					{/if}

					{#if quote.cleaningFee > 0}
						<div class="flex items-baseline justify-between gap-3">
							<dt class="text-muted-foreground">Cleaning fee</dt>
							<dd class="font-medium tabular-nums">{formatCurrency(quote.cleaningFee)}</dd>
						</div>
					{/if}

					<!-- The platform's cut, shown as its own line BEFORE the guest commits
					     (AccommodationsSystemDesign.md §8). Zero outside `booking_fee` mode, so the
					     line simply isn't there — no empty row, no "€0 service fee". -->
					{#if quote.platformFee > 0}
						<div class="flex items-baseline justify-between gap-3">
							<dt class="text-muted-foreground">Service fee</dt>
							<dd class="font-medium tabular-nums">{formatCurrency(quote.platformFee)}</dd>
						</div>
					{/if}
				</dl>
			{/if}

			<Separator />

			<!-- Total — the anchor of the card: biggest, boldest line so the eye lands here first. -->
			<div class="flex items-baseline justify-between gap-3">
				<span class="text-base font-semibold">Total</span>
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
				Add your dates to see the full price — from
			</p>
			<!-- The actual nightly price leads and stays the anchor; the original is struck and
			     muted so it reads as "old", and the badge quantifies the win. A guest's eye lands
			     on the first big number — make it the one they actually pay. -->
			<p class="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
				<span class="flex items-baseline gap-1.5">
					<span class="text-2xl font-bold tracking-tight text-foreground">
						{formatCurrency(quote.nightly)}
					</span>
					<span class="text-sm font-medium text-muted-foreground"> / night. </span>
				</span>
				{#if discounted}
					<span class="text-sm text-muted-foreground/60 tabular-nums line-through">
						{formatCurrency(accommodation.pricePerNight)}
					</span>
					<span
						class="rounded-md bg-destructive/10 px-1.5 py-0.5 text-xs font-semibold text-destructive tabular-nums"
						>−{discountPercent}%</span
					>
				{/if}
			</p>
		</div>

		<!-- The listing's rate structure, shown before dates exist to price it. One row per
		     component that actually applies; the arithmetic below takes over once dates are
		     picked, so the same fact is never stated twice. -->
		{#if pricingFeatures.length > 0}
			<dl class="space-y-2.5 border-t border-border pt-3 text-sm">
				{#each pricingFeatures as feature (feature.label)}
					<div class="flex items-center gap-2.5">
						<feature.icon class="size-3.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
						<dt class="flex-1 text-muted-foreground">{feature.label}</dt>
						<dd class="text-right font-medium tabular-nums">{feature.value}</dd>
					</div>
				{/each}
			</dl>
		{/if}
	{/if}
</div>
