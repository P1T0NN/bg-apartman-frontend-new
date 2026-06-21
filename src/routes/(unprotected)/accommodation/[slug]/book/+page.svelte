<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// LIBRARIES
	import { toast } from 'svelte-sonner';

	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import { Link } from '@/shared/components/ui/link/index.js';
	import { Separator } from '@/shared/components/ui/separator/index.js';
	import BookTripDetails from '@/shared/components/pages/(unprotected)/book/book-trip-details.svelte';
	import BookSummaryCard from '@/shared/components/pages/(unprotected)/book/book-summary-card.svelte';
	import BookGuestForm from '@/shared/components/pages/(unprotected)/book/book-guest-form.svelte';
	import BookConfirmation from '@/shared/components/pages/(unprotected)/book/book-confirmation.svelte';

	// LUCIDE ICONS
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';

	// DATA
	import { getAccommodationBySlug } from '@/features/accommodations/data/accommodationDummyData';

	// UTILS
	import { nightsBetween } from '@/features/accommodations/utils/accommodationPresentation';

	// TYPES
	import type { GuestDetails } from '@/shared/components/pages/(unprotected)/book/book-guest-form.svelte';

	const slug = $derived(page.params.slug ?? '');
	const accommodation = $derived(getAccommodationBySlug(slug));

	// The trip selection arrives from the listing's Reserve button as query params.
	const checkIn = $derived(page.url.searchParams.get('checkIn'));
	const checkOut = $derived(page.url.searchParams.get('checkOut'));
	const adults = $derived(Number(page.url.searchParams.get('adults') ?? '2') || 2);
	const children = $derived(Number(page.url.searchParams.get('children') ?? '0') || 0);

	const hasDates = $derived(nightsBetween(checkIn, checkOut) > 0);
	// Canonical path — `Link` localizes it; `BookConfirmation` localizes for its Button.
	const listingHref = $derived(`/accommodation/${slug}`);

	let confirmation = $state<{ code: string; email: string } | null>(null);

	function makeBookingCode(): string {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		let code = 'BK';
		for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
		return code;
	}

	function handleConfirm(details: GuestDetails) {
		// Dummy: a real impl writes to the `bookings` table and returns the code.
		const code = makeBookingCode();
		confirmation = { code, email: details.email };
		toast.success(accommodation.instantBooking ? 'Booking confirmed' : 'Request sent', {
			description: `${accommodation.title} · ${code}`
		});
		if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<SvelteHead title={`Book ${accommodation.title}`} description="Confirm your booking details." noIndex />

<div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
	{#if confirmation}
		<BookConfirmation
			{accommodation}
			bookingCode={confirmation.code}
			guestEmail={confirmation.email}
			{checkIn}
			{checkOut}
			{adults}
			{children}
			{listingHref}
		/>
	{:else}
		<div class="mb-6 space-y-3">
			<Link
				href={listingHref}
				class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				<ChevronLeftIcon class="size-4" aria-hidden="true" />
				Back to listing
			</Link>
			<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">
				{accommodation.instantBooking ? 'Confirm your booking' : 'Request to book'}
			</h1>
		</div>

		{#if !hasDates}
			<div
				class="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-foreground/90"
			>
				You haven’t picked your dates yet.
				<Link href={listingHref} class="font-medium underline underline-offset-4">
					Choose dates on the listing
				</Link>
				to see the full price and confirm.
			</div>
		{/if}

		<div class="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
			<!-- Left: trip recap + guest form (below the summary on mobile) -->
			<div class="order-2 min-w-0 space-y-8 lg:order-1">
				<BookTripDetails {checkIn} {checkOut} {adults} {children} editHref={listingHref} />
				<Separator />
				<BookGuestForm {accommodation} disabled={!hasDates} onConfirm={handleConfirm} />
			</div>

			<!-- Right: sticky order summary (above the form on mobile) -->
			<aside class="order-1 lg:order-2">
				<div class="lg:sticky lg:top-20">
					<BookSummaryCard {accommodation} {checkIn} {checkOut} {adults} {children} />
				</div>
			</aside>
		</div>
	{/if}
</div>
