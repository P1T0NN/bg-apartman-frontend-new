<script lang="ts">
	// COMPONENTS
	import { Separator } from '@/shared/components/ui/separator/index.js';
	import BookSummaryAccommodation from './book-summary-accommodation.svelte';
	import BookGuestDetails from './book-guest-details.svelte';
	import BookPrice from './book-price.svelte';

	// TYPES
	import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';

	let {
		accommodation,
		checkIn,
		checkOut,
		adults,
		children
	}: {
		accommodation: typesAccommodationEnriched;
		checkIn: string | null;
		checkOut: string | null;
		adults: number;
		children: number;
	} = $props();
</script>

<div class="space-y-5 rounded-2xl border p-5 sm:p-6">
	<BookSummaryAccommodation {accommodation} />

	<Separator />

	<BookGuestDetails {checkIn} {checkOut} {adults} {children} />

	<Separator />

	<BookPrice {accommodation} {checkIn} {checkOut} />
</div>
