<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';
	import { page } from '$app/state';

	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import { Card } from '@/shared/components/ui/card/index.js';
	import { Separator } from '@/shared/components/ui/separator/index.js';
	import AccommodationGallerySection from '@/shared/components/pages/(unprotected)/accommodation/accommodation-gallery-section/accommodation-gallery-section.svelte';
	import AccommodationOverviewSection from '@/shared/components/pages/(unprotected)/accommodation/accommodation-overview-section/accommodation-overview-section.svelte';
	import AccommodationSummarySection from '@/shared/components/pages/(unprotected)/accommodation/accommodation-summary-section/accommodation-summary-section.svelte';
	import AccommodationAmenitiesSection from '@/shared/components/pages/(unprotected)/accommodation/accommodations-amenities-section/accommodation-amenities-section.svelte';
	import AccommodationLocationSection from '@/shared/components/pages/(unprotected)/accommodation/accommodation-location-section/accommodation-location-section.svelte';
	import AccommodationPoliciesSection from '@/shared/components/pages/(unprotected)/accommodation/accommodation-policies-section/accommodation-policies-section.svelte';
	import AccommodationBookingPanel from '@/shared/components/pages/(unprotected)/accommodation/accommodation-booking-panel/accommodation-booking-panel.svelte';
	import AccommodationMobileBar from '@/shared/components/pages/(unprotected)/accommodation/accommodation-mobile-bar.svelte';
	import AccommodationPageLoading from '@/shared/components/pages/(unprotected)/accommodation/loading/accommodation-page-loading.svelte';
	import AccommodationPageEmpty from '@/shared/components/pages/(unprotected)/accommodation/empty/accommodation-page-empty.svelte';
	import AccommodationPageError from '@/shared/components/pages/(unprotected)/accommodation/error/accommodation-page-error.svelte';

	// TYPES
	import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';

	// The route param is the lookup key — resolving reactively means navigating between
	// listings (client-side) re-runs the query for the new slug. `page` is app-wide so
	// `params.slug` is `string | undefined`; this route always has one at runtime.
	const slug = $derived(page.params.slug ?? '');

	const accommodationQuery = useQuery(
		api.tables.accommodations.queries.fetchAccommodationBySlugSafe.fetchAccommodationBySlugSafe,
		() => (slug ? { slug } : 'skip')
	);
	const accommodation = $derived(accommodationQuery.data as typesAccommodationEnriched | null | undefined);

	const images = $derived(
		accommodation ? [...accommodation.images].sort((a, b) => a.order - b.order) : []
	);

	const headTitle = $derived(
		accommodation ? `${accommodation.title} — ${accommodation.city}` : 'Accommodation'
	);
	const headDescription = $derived(
		accommodation ? accommodation.description.slice(0, 155) : 'View accommodation details.'
	);
</script>

<SvelteHead title={headTitle} description={headDescription} />

{#if accommodationQuery.error}
	<AccommodationPageError />
{:else if accommodation === null}
	<AccommodationPageEmpty />
{:else if accommodation === undefined}
	<AccommodationPageLoading />
{:else}
	<div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="py-5 md:py-6">
			<AccommodationGallerySection {images} title={accommodation.title} />
		</div>

		<div
			class="grid grid-cols-1 gap-x-12 gap-y-8 pb-28 lg:grid-cols-[minmax(0,1fr)_24rem] lg:pb-16"
		>
			<div class="min-w-0 space-y-8 lg:space-y-10">
				<AccommodationOverviewSection {accommodation} />

				<Separator />

				<AccommodationSummarySection {accommodation} />

				<Separator />

				<AccommodationAmenitiesSection amenities={accommodation.amenities} />

				<Separator />

				<AccommodationLocationSection {accommodation} />

				<Separator />

				<AccommodationPoliciesSection {accommodation} />
			</div>

			<aside class="hidden lg:block">
				<div class="sticky top-20">
					<Card class="p-6 shadow-sm">
						<AccommodationBookingPanel {accommodation} />
					</Card>
				</div>
			</aside>
		</div>
	</div>

	<AccommodationMobileBar {accommodation} />
{/if}
