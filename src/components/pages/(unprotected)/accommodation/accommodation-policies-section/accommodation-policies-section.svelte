<script lang="ts">
	// CLASSES
	import { createAccommodationPoliciesRules } from './index.svelte.js';

	// COMPONENTS
	import AccommodationPoliciesItem from './accommodation-policies-item.svelte';

	// TYPES
	import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';

	let { accommodation }: { accommodation: typesAccommodationEnriched } = $props();

	const { houseRules, bookingRules } = $derived(createAccommodationPoliciesRules(accommodation));
</script>

<section class="space-y-5">
	<h2 class="text-lg font-semibold tracking-tight">Things to know</h2>

	<div class="grid gap-8 sm:grid-cols-2">
		<div class="space-y-3">
			<h3 class="text-sm font-semibold">House rules</h3>
			<ul class="space-y-3">
				{#each houseRules as rule (rule.label)}
					<AccommodationPoliciesItem icon={rule.icon} label={rule.label} />
				{/each}
			</ul>
		</div>

		<div class="space-y-3">
			<h3 class="text-sm font-semibold">Booking & stay</h3>
			<ul class="space-y-3">
				{#each bookingRules as rule (rule.label)}
					<AccommodationPoliciesItem icon={rule.icon} label={rule.label} />
				{/each}
			</ul>
		</div>
	</div>

	{#if accommodation.houseRules}
		<p
			class="rounded-lg border border-dashed bg-muted/20 p-4 text-sm leading-relaxed text-foreground/90"
		>
			{accommodation.houseRules}
		</p>
	{/if}
</section>
