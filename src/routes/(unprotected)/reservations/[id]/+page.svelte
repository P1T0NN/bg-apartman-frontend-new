<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';
	import { m } from '@/shared/lib/paraglide/messages';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/constants';

	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import Section from '@/shared/components/ui/section/section.svelte';
	import ReservationConfirmation from '@/shared/components/pages/(unprotected)/reservation/reservation-confirmation.svelte';
	import ReservationPageLoading from '@/shared/components/pages/(unprotected)/reservation/loading/reservation-page-loading.svelte';
	import ReservationPageEmpty from '@/shared/components/pages/(unprotected)/reservation/empty/reservation-page-empty.svelte';
	import ReservationPageError from '@/shared/components/pages/(unprotected)/reservation/error/reservation-page-error.svelte';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { typesReservationBooking } from '@/shared/features/booking/types/bookingTypes';

	// `params.id` is `string | undefined` at the type level; on `[id]` it's always present at
	// runtime. `'skip'` while missing keeps the query type-safe and avoids a bad request.
	const id = $derived(page.params.id);

	const bookingQuery = useQuery(
		api.tables.bookings.queries.fetchBookingById.fetchBookingById,
		() => (id ? { id: id as Id<'bookings'> } : 'skip')
	);
	const booking = $derived(bookingQuery.data as typesReservationBooking | null | undefined);
</script>

<SvelteHead
	title={m['ReservationPage.SEO.title']({
		accommodationTitle: booking?.apartmentTitle ?? '',
		companyName: COMPANY_DATA.NAME
	})}
	description={m['ReservationPage.SEO.description']({
		accommodationTitle: booking?.apartmentTitle ?? ''
	})}
	noIndex
/>

<Section
	yPadding="none"
	class="min-h-[calc(100dvh-3.5rem)] py-6 lg:py-8"
	containerClass="max-w-2xl flex min-h-full flex-col justify-center"
>
	{#if bookingQuery.error}
		<ReservationPageError />
	{:else if booking === undefined}
		<ReservationPageLoading />
	{:else if booking === null}
		<ReservationPageEmpty />
	{:else}
		<ReservationConfirmation {booking} />
	{/if}
</Section>
