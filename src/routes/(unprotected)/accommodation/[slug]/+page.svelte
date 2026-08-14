<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';
	import { page } from '$app/state';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import { Card } from '@/components/ui/card/index.js';
	import { Separator } from '@/components/ui/separator/index.js';
	import ImageGallery from '@/components/ui/image-gallery/image-gallery.svelte';
	import AccommodationOverviewSection from '@/components/pages/(unprotected)/accommodation/accommodation-overview-section/accommodation-overview-section.svelte';
	import AccommodationSummarySection from '@/components/pages/(unprotected)/accommodation/accommodation-summary-section/accommodation-summary-section.svelte';
	import AccommodationAmenitiesSection from '@/components/pages/(unprotected)/accommodation/accommodations-amenities-section/accommodation-amenities-section.svelte';
	import AccommodationLocationSection from '@/components/pages/(unprotected)/accommodation/accommodation-location-section/accommodation-location-section.svelte';
	import AccommodationPoliciesSection from '@/components/pages/(unprotected)/accommodation/accommodation-policies-section/accommodation-policies-section.svelte';
	import AccommodationBookingPanel from '@/components/pages/(unprotected)/accommodation/accommodation-booking-panel/accommodation-booking-panel.svelte';
	import AccommodationMobileBar from '@/components/pages/(unprotected)/accommodation/accommodation-mobile-bar.svelte';
	import AccommodationPageLoading from '@/components/pages/(unprotected)/accommodation/loading/accommodation-page-loading.svelte';
	import AccommodationPageEmpty from '@/components/pages/(unprotected)/accommodation/empty/accommodation-page-empty.svelte';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';

	// TYPES
	import type { typesAccommodationForViewer } from '@/shared/features/accommodation/types/accommodationTypes';

	// The route param is the lookup key — resolving reactively means navigating between
	// accommodations (client-side) re-runs the query for the new slug. `page` is app-wide so
	// `params.slug` is `string | undefined`; this route always has one at runtime.
	const slug = $derived(page.params.slug ?? '');

	const accommodationQuery = useQuery(
		api.tables.accommodations.queries.fetchAccommodationBySlugSafe.fetchAccommodationBySlugSafe,
		() => (slug ? { slug } : 'skip')
	);
	const accommodation = $derived(
		accommodationQuery.data as typesAccommodationForViewer | null | undefined
	);

	const images = $derived(
		accommodation ? [...accommodation.images].sort((a, b) => a.order - b.order) : []
	);

	const headTitle = $derived(
		accommodation
			? m['AccommodationPage.SEO.title']({ title: accommodation.title, city: accommodation.city })
			: m['AccommodationPage.SEO.fallbackTitle']()
	);
	const headDescription = $derived(
		accommodation
			? accommodation.description.slice(0, 155)
			: m['AccommodationPage.SEO.fallbackDescription']()
	);
</script>

<SvelteHead title={headTitle} description={headDescription} />

{#if accommodationQuery.error}
	<ErrorComponent
		variant="alert"
		title={m['AccommodationPage.loadErrorTitle']()}
		description={m['AccommodationPage.loadErrorDescription']()}
	/>
{:else if accommodation === null}
	<AccommodationPageEmpty />
{:else if accommodation === undefined}
	<AccommodationPageLoading />
{:else}
	<div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="py-5 md:py-6">
			<ImageGallery {images} title={accommodation.title} />
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

				<AccommodationPoliciesSection {accommodation} />
			</div>

			<aside class="hidden lg:block">
				<div
					class="sticky top-20 max-h-[calc(100vh-5rem)] space-y-6 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
				>
					<Card class="p-6 shadow-sm">
						<AccommodationBookingPanel {accommodation} />
					</Card>

					<Card class="p-6 shadow-sm">
						<AccommodationLocationSection {accommodation} />
					</Card>
				</div>
			</aside>
		</div>
	</div>

	<AccommodationMobileBar {accommodation} />
{/if}
