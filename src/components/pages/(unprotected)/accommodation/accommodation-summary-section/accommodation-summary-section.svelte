<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Separator } from '@/components/ui/separator/index.js';
	import AccommodationSummaryItem from './accommodation-summary-item.svelte';
	import AccommodationSummaryDescription from './accommodation-summary-description.svelte';

	// TYPES
	import type { Component } from 'svelte';
	import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';

	// LUCIDE ICONS
	import ZapIcon from '@lucide/svelte/icons/zap';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import AwardIcon from '@lucide/svelte/icons/award';
	import DogIcon from '@lucide/svelte/icons/dog';
	import CarIcon from '@lucide/svelte/icons/car';

	let { accommodation }: { accommodation: typesAccommodationEnriched } = $props();

	let expanded = $state(false);

	type Highlight = { icon: Component; title: string; text: string };

	const highlights = $derived.by<Highlight[]>(() => {
		const out: Highlight[] = [];
		if (accommodation.instantBooking) {
			out.push({
				icon: ZapIcon,
				title: m['AccommodationPage.AccommodationSummarySection.instantBookingTitle'](),
				text: m['AccommodationPage.AccommodationSummarySection.instantBookingText']()
			});
		}
		if (accommodation.amenities.includes('self_checkin')) {
			out.push({
				icon: KeyRoundIcon,
				title: m['AccommodationPage.AccommodationSummarySection.selfCheckInTitle'](),
				text: m['AccommodationPage.AccommodationSummarySection.selfCheckInText']()
			});
		}
		if (accommodation.host.isSuperhost) {
			out.push({
				icon: AwardIcon,
				title: m['AccommodationPage.AccommodationSummarySection.superhostTitle']({
					name: accommodation.host.name
				}),
				text: m['AccommodationPage.AccommodationSummarySection.superhostText']()
			});
		}
		if (accommodation.petsAllowed) {
			out.push({
				icon: DogIcon,
				title: m['AccommodationPage.AccommodationSummarySection.petsTitle'](),
				text: m['AccommodationPage.AccommodationSummarySection.petsText']()
			});
		}
		if (accommodation.amenities.includes('free_parking')) {
			out.push({
				icon: CarIcon,
				title: m['AccommodationPage.AccommodationSummarySection.parkingTitle'](),
				text: m['AccommodationPage.AccommodationSummarySection.parkingText']()
			});
		}
		return out.slice(0, 3);
	});
</script>

<section class="space-y-6">
	{#if highlights.length > 0}
		<ul class="space-y-4">
			{#each highlights as highlight (highlight.title)}
				<AccommodationSummaryItem
					icon={highlight.icon}
					title={highlight.title}
					text={highlight.text}
				/>
			{/each}
		</ul>

		<Separator />
	{/if}

	<AccommodationSummaryDescription bind:expanded description={accommodation.description} />
</section>
