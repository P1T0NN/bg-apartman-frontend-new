<script lang="ts">
	// COMPONENTS
	import { Separator } from '@/shared/components/ui/separator/index.js';
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
				title: 'Instant booking',
				text: 'Your dates are confirmed straight away — no waiting for approval.'
			});
		}
		if (accommodation.amenities.includes('self_checkin')) {
			out.push({
				icon: KeyRoundIcon,
				title: 'Self check-in',
				text: 'Let yourself in any time with the keypad — no meet-up needed.'
			});
		}
		if (accommodation.host.isSuperhost) {
			out.push({
				icon: AwardIcon,
				title: `${accommodation.host.name} is a Superhost`,
				text: 'Superhosts are experienced, highly rated hosts committed to great stays.'
			});
		}
		if (accommodation.petsAllowed) {
			out.push({
				icon: DogIcon,
				title: 'Pets are welcome',
				text: 'Travelling with a furry friend? Just let the host know in advance.'
			});
		}
		if (accommodation.amenities.includes('free_parking')) {
			out.push({
				icon: CarIcon,
				title: 'Free parking on site',
				text: 'Leave the car right outside, at no extra cost.'
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
