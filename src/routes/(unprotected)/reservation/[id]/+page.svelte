<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// CONFIG
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import { Button } from '@/shared/components/ui/button/index.js';
	import BookConfirmation from '@/shared/components/pages/(unprotected)/book/book-confirmation.svelte';

	// DATA
	import { getAccommodationBySlug } from '@/features/accommodations/data/accommodationDummyData';

	// LUCIDE ICONS
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import SearchXIcon from '@lucide/svelte/icons/search-x';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	// TYPES
	import type { Doc, Id } from '@/convex/_generated/dataModel';

	// `params.id` is `string | undefined` at the type level; on `[id]` it's always present at
	// runtime. `'skip'` while missing keeps the query type-safe and avoids a bad request.
	const id = $derived(page.params.id);

	const bookingQuery = useQuery(api.tables.bookings.queries.getBookingById.getBookingById, () =>
		id ? { id: id as Id<'bookings'> } : 'skip'
	);
	const booking = $derived(bookingQuery.data as Doc<'bookings'> | null | undefined);

	// The apartment still comes from front-end dummy data, resolved by the slug stored on the
	// booking (swap for a Convex fetch once listings are persisted).
	const accommodation = $derived(booking ? getAccommodationBySlug(booking.apartmentSlug) : null);
</script>

<SvelteHead title="Your reservation" description="Your booking details and confirmation code." noIndex />

<div class="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:py-8">
	{#if bookingQuery.error}
		<div class="mx-auto max-w-md py-16 text-center">
			<div
				class="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
			>
				<TriangleAlertIcon class="size-6" aria-hidden="true" />
			</div>
			<h1 class="mt-4 text-xl font-semibold tracking-tight">Something went wrong</h1>
			<p class="mt-2 text-sm text-muted-foreground">
				We couldn’t load this reservation. Please try again in a moment.
			</p>
			<Button class="mt-6" href={localizeHref('/search')}>Browse stays</Button>
		</div>
	{:else if booking === undefined}
		<div class="flex flex-col items-center justify-center py-24 text-muted-foreground">
			<LoaderCircleIcon class="size-6 animate-spin" aria-hidden="true" />
			<p class="mt-3 text-sm">Loading your reservation…</p>
		</div>
	{:else if booking === null || !accommodation}
		<div class="mx-auto max-w-md py-16 text-center">
			<div
				class="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
			>
				<SearchXIcon class="size-6" aria-hidden="true" />
			</div>
			<h1 class="mt-4 text-xl font-semibold tracking-tight">Reservation not found</h1>
			<p class="mt-2 text-sm text-muted-foreground">
				This reservation link is invalid or may have been removed. Check the link from your
				confirmation, or browse other stays.
			</p>
			<Button class="mt-6" href={localizeHref('/search')}>Browse stays</Button>
		</div>
	{:else}
		<BookConfirmation
			{accommodation}
			bookingCode={booking.bookingCode}
			guestEmail={booking.guestEmail}
			checkIn={booking.checkInDate}
			checkOut={booking.checkOutDate}
			adults={booking.numberOfAdults}
			children={booking.numberOfChildren}
			paymentMethod={booking.paymentMethod}
			listingHref={`/accommodation/${booking.apartmentSlug}`}
		/>
	{/if}
</div>
