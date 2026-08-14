<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// UTILS
	import { formatCurrency } from '@/utils/formatters';
	import { minNightsFor } from '@/features/accommodations/utils/accommodationPresentation';

	// TYPES
	import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';

	// LUCIDE ICONS
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import UsersIcon from '@lucide/svelte/icons/users';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import SunIcon from '@lucide/svelte/icons/sun';
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import ClockIcon from '@lucide/svelte/icons/clock';

	let { accommodation }: { accommodation: typesAccommodationEnriched } = $props();

	const cleaningFee = $derived(accommodation.cleaningFee ?? 0);
	const hasWeekendPremium = $derived(
		!!accommodation.weekendPremium && accommodation.weekendPremium > 0
	);
	const hasWeeklyDiscount = $derived(
		!!accommodation.weeklyDiscount && accommodation.weeklyDiscount > 0
	);
	const minNights = $derived(minNightsFor(accommodation));
</script>

<div class="space-y-2">
	<!-- Check-in / Check-out -->
	<div class="grid grid-cols-2 overflow-hidden rounded-lg border bg-muted/30">
		<div class="px-3 py-2.5">
			<p class="flex items-center gap-1.5 text-xs text-muted-foreground">
				<LogInIcon class="size-3.5" aria-hidden="true" />
				{m['AccommodationPage.BookingPanelFacts.checkIn']()}
			</p>
			<p class="mt-0.5 text-sm font-medium">{accommodation.checkInTime ?? '—'}</p>
		</div>
		<div class="border-l px-3 py-2.5">
			<p class="flex items-center gap-1.5 text-xs text-muted-foreground">
				<LogOutIcon class="size-3.5" aria-hidden="true" />
				{m['AccommodationPage.BookingPanelFacts.checkOut']()}
			</p>
			<p class="mt-0.5 text-sm font-medium">{accommodation.checkOutTime ?? '—'}</p>
		</div>
	</div>

	<!-- Max guests -->
	<div class="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
		<span class="flex items-center gap-2 text-sm text-muted-foreground">
			<UsersIcon class="size-4" aria-hidden="true" />
			{m['AccommodationPage.BookingPanelFacts.maxGuests']()}
		</span>
		<span class="text-sm font-medium">{accommodation.maxGuests}</span>
	</div>

	<!-- Cleaning fee -->
	<div class="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
		<span class="flex items-center gap-2 text-sm text-muted-foreground">
			<SparklesIcon class="size-4" aria-hidden="true" />
			{m['AccommodationPage.BookingPanelFacts.cleaningFee']()}
		</span>
		<span class={cleaningFee > 0 ? 'text-sm font-medium' : 'text-sm text-muted-foreground'}>
			{#if cleaningFee > 0}
				{formatCurrency(cleaningFee)}
			{:else}
				{m['AccommodationPage.BookingPanelFacts.noCleaningFee']()}
			{/if}
		</span>
	</div>

	{#if hasWeekendPremium}
		<div class="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
			<span class="flex items-center gap-2 text-sm text-muted-foreground">
				<SunIcon class="size-4" aria-hidden="true" />
				{m['AccommodationPage.BookingPanelFacts.weekendNights']()}
			</span>
			<span class="text-sm font-medium">{formatCurrency(accommodation.weekendPremium ?? 0)}</span>
		</div>
	{/if}

	{#if hasWeeklyDiscount}
		<div class="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
			<span class="flex items-center gap-2 text-sm text-muted-foreground">
				<CalendarDaysIcon class="size-4" aria-hidden="true" />
				{m['AccommodationPage.BookingPanelFacts.weeklyDiscount']()}
			</span>
			<span class="text-sm font-medium">
				{m['AccommodationPage.BookingPanelFacts.weeklyDiscountOff']({
					percent: accommodation.weeklyDiscount ?? 0
				})}
			</span>
		</div>
	{/if}

	{#if minNights > 1}
		<div class="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
			<span class="flex items-center gap-2 text-sm text-muted-foreground">
				<ClockIcon class="size-4" aria-hidden="true" />
				{m['AccommodationPage.BookingPanelFacts.minimumStay']()}
			</span>
			<span class="text-sm font-medium">
				{m['AccommodationPage.BookingPanelFacts.nightsCount']({ count: minNights })}
			</span>
		</div>
	{/if}
</div>
