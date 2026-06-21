<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import { Card } from '@/shared/components/ui/card/index.js';
	import { Separator } from '@/shared/components/ui/separator/index.js';
	import AccommodationGallery from '@/shared/components/pages/(unprotected)/accommodation/accommodation-gallery.svelte';
	import AccommodationOverview from '@/shared/components/pages/(unprotected)/accommodation/accommodation-overview.svelte';
	import AccommodationSummary from '@/shared/components/pages/(unprotected)/accommodation/accommodation-summary.svelte';
	import AccommodationAmenities from '@/shared/components/pages/(unprotected)/accommodation/accommodation-amenities.svelte';
	import AccommodationLocation from '@/shared/components/pages/(unprotected)/accommodation/accommodation-location.svelte';
	import AccommodationPolicies from '@/shared/components/pages/(unprotected)/accommodation/accommodation-policies.svelte';
	import AccommodationHost from '@/shared/components/pages/(unprotected)/accommodation/accommodation-host.svelte';
	import AccommodationBookingPanel from '@/shared/components/pages/(unprotected)/accommodation/accommodation-booking-panel.svelte';
	import AccommodationMobileBar from '@/shared/components/pages/(unprotected)/accommodation/accommodation-mobile-bar.svelte';

	// SVELTEKIT
	import { page } from '$app/state';

	// DATA
	import { getAccommodationBySlug } from '@/features/accommodations/data/accommodationDummyData';

	// TYPES
	import type { DateRange } from 'bits-ui';

	// The route param is the lookup key — resolving reactively means navigating
	// between listings (client-side) re-renders with the new accommodation.
	// `page` is app-wide so `params.slug` is `string | undefined`; this route always
	// has one at runtime, so fall back to an empty string to keep the type a string.
	const slug = $derived(page.params.slug ?? '');
	const accommodation = $derived(getAccommodationBySlug(slug));
	const images = $derived([...accommodation.images].sort((a, b) => a.order - b.order));

	// Booking state is shared between the desktop sticky card and the mobile sheet
	// so a guest's date/guest choices follow them across breakpoints.
	let dateRange = $state<DateRange>({ start: undefined, end: undefined });
	let adults = $state(2);
	let children = $state(0);
</script>

<SvelteHead
	title={`${accommodation.title} — ${accommodation.city}`}
	description={accommodation.description.slice(0, 155)}
/>

<div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
	<div class="py-5 md:py-6">
		<AccommodationGallery {images} title={accommodation.title} />
	</div>

	<div
		class="grid grid-cols-1 gap-x-12 gap-y-8 pb-28 lg:grid-cols-[minmax(0,1fr)_24rem] lg:pb-16"
	>
		<!-- Left: listing details -->
		<div class="min-w-0 space-y-8 lg:space-y-10">
			<AccommodationOverview {accommodation} />
			<Separator />
			<AccommodationSummary {accommodation} />
			<Separator />
			<AccommodationAmenities amenities={accommodation.amenities} />
			<Separator />
			<AccommodationLocation {accommodation} />
			<Separator />
			<AccommodationPolicies {accommodation} />
			<Separator />
			<AccommodationHost host={accommodation.host} />
		</div>

		<!-- Right: sticky reserve card (desktop) -->
		<aside class="hidden lg:block">
			<div class="sticky top-20">
				<Card class="p-6 shadow-sm">
					<AccommodationBookingPanel
						{accommodation}
						bind:dateRange
						bind:adults
						bind:children
					/>
				</Card>
			</div>
		</aside>
	</div>
</div>

<!-- Mobile: sticky reserve bar + sheet -->
<AccommodationMobileBar {accommodation} bind:dateRange bind:adults bind:children />
