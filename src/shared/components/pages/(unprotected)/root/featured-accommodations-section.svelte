<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// COMPONENTS
	import Section from '@/shared/components/ui/section/section.svelte';
	import AccommodationCard from '@/features/accommodations/components/accommodation-card/accommodation-card.svelte';
	import FeaturedAccommodationsLoading from './loading/featured-accommodations-loading.svelte';
	import FeaturedAccommodationsEmpty from './empty/featured-accommodations-empty.svelte';
	import FeaturedAccommodationsError from './error/featured-accommodations-error.svelte';

	// TYPES
	import type { SearchAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';

	const featuredQuery = useQuery(
		api.tables.accommodations.queries.fetchFeaturedAccommodations.fetchFeaturedAccommodations,
		{}
	);

	// convex-svelte: `data` is `undefined` while loading, then the resolved array; `error` is set
	// on failure. Same branch order as the accommodation page (error → loading → empty → data).
	const featured = $derived(featuredQuery.data as SearchAccommodation[] | undefined);
</script>

<Section id="featured-stays" class="scroll-mt-14" yPadding="lg" containerClass="flex flex-col gap-10">
	<!-- Header -->
	<div class="max-w-xl">
		<p class="text-xs font-semibold tracking-[0.22em] text-primary uppercase">Featured stays</p>
		<h2
			class="mt-3 font-display text-3xl font-medium tracking-tight text-balance text-foreground sm:text-4xl"
		>
			Handpicked apartments in Belgrade
		</h2>
		<p class="mt-3 text-pretty text-muted-foreground">
			A short, curated selection — verified hosts, honest photos and clear pricing.
		</p>
	</div>

	{#if featuredQuery.error}
		<FeaturedAccommodationsError />
	{:else if featured === undefined}
		<FeaturedAccommodationsLoading />
	{:else if featured.length === 0}
		<FeaturedAccommodationsEmpty />
	{:else}
		<div class="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
			{#each featured as accommodation (accommodation.id)}
				<AccommodationCard {accommodation} featured boxed />
			{/each}
		</div>
	{/if}
</Section>
