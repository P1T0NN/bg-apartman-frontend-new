<script lang="ts">
	// UTILS
	import { formatTime12 } from '@/features/accommodations/utils/accommodationPresentation';

	// LUCIDE ICONS
	import ClockIcon from '@lucide/svelte/icons/clock';
	import UsersIcon from '@lucide/svelte/icons/users';
	import DogIcon from '@lucide/svelte/icons/dog';
	import CigaretteIcon from '@lucide/svelte/icons/cigarette';
	import CigaretteOffIcon from '@lucide/svelte/icons/cigarette-off';
	import PartyPopperIcon from '@lucide/svelte/icons/party-popper';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import ZapIcon from '@lucide/svelte/icons/zap';

	// TYPES
	import type { Component } from 'svelte';
	import type { AccommodationDetail } from '@/features/accommodations/data/accommodationDummyData';

	let { accommodation: a }: { accommodation: AccommodationDetail } = $props();

	type Rule = { icon: Component; label: string };

	const houseRules = $derived.by<Rule[]>(() => {
		const rules: Rule[] = [
			{ icon: ClockIcon, label: `Check-in after ${formatTime12(a.checkInTime)}` },
			{ icon: ClockIcon, label: `Checkout before ${formatTime12(a.checkOutTime)}` },
			{ icon: UsersIcon, label: `Up to ${a.maxGuests} guests` },
			{ icon: DogIcon, label: a.petsAllowed ? 'Pets allowed' : 'No pets' },
			{
				icon: a.smokingAllowed ? CigaretteIcon : CigaretteOffIcon,
				label: a.smokingAllowed ? 'Smoking allowed' : 'No smoking'
			},
			{ icon: PartyPopperIcon, label: a.partiesAllowed ? 'Events allowed' : 'No parties or events' }
		];
		if (a.quietHoursStart && a.quietHoursEnd) {
			rules.push({
				icon: MoonIcon,
				label: `Quiet hours ${a.quietHoursStart}–${a.quietHoursEnd}`
			});
		}
		return rules;
	});

	const bookingRules = $derived.by<Rule[]>(() => {
		const rules: Rule[] = [
			{ icon: CalendarIcon, label: `Minimum stay ${a.minReservationDays} nights` }
		];
		if (a.maxReservationDays) {
			rules.push({ icon: CalendarIcon, label: `Maximum stay ${a.maxReservationDays} nights` });
		}
		rules.push({
			icon: ZapIcon,
			label: a.instantBooking ? 'Instant booking' : 'Request to book'
		});
		rules.push({
			icon: ClockIcon,
			label: a.sameDayReservation ? 'Same-day bookings accepted' : 'No same-day bookings'
		});
		return rules;
	});
</script>

<section class="space-y-5">
	<h2 class="text-lg font-semibold tracking-tight">Things to know</h2>

	<div class="grid gap-8 sm:grid-cols-2">
		<div class="space-y-3">
			<h3 class="text-sm font-semibold">House rules</h3>
			<ul class="space-y-3">
				{#each houseRules as rule (rule.label)}
					{@const Icon = rule.icon}
					<li class="flex items-center gap-3 text-sm text-muted-foreground">
						<Icon class="size-4 shrink-0" aria-hidden="true" />
						<span>{rule.label}</span>
					</li>
				{/each}
			</ul>
		</div>

		<div class="space-y-3">
			<h3 class="text-sm font-semibold">Booking &amp; stay</h3>
			<ul class="space-y-3">
				{#each bookingRules as rule (rule.label)}
					{@const Icon = rule.icon}
					<li class="flex items-center gap-3 text-sm text-muted-foreground">
						<Icon class="size-4 shrink-0" aria-hidden="true" />
						<span>{rule.label}</span>
					</li>
				{/each}
			</ul>
		</div>
	</div>

	{#if a.houseRules}
		<p class="rounded-lg border border-dashed bg-muted/20 p-4 text-sm leading-relaxed text-foreground/90">
			{a.houseRules}
		</p>
	{/if}
</section>
