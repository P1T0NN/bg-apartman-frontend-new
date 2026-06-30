<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';
	import { parseDate, type DateValue } from '@internationalized/date';
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import { Separator } from '@/shared/components/ui/separator/index.js';
	import BookDetails from '@/shared/components/pages/(unprotected)/book/book-details/book-details.svelte';
	import BookSummaryCard from '@/shared/components/pages/(unprotected)/book/book-summary-card/book-summary-card.svelte';
	import BookGuestForm from '@/shared/components/pages/(unprotected)/book/book-guest-form/book-guest-form.svelte';
	import BookHeader from '@/shared/components/pages/(unprotected)/book/book-guest-form/book-header.svelte';
	import AccommodationPageLoading from '@/shared/components/pages/(unprotected)/accommodation/loading/accommodation-page-loading.svelte';
	import AccommodationPageEmpty from '@/shared/components/pages/(unprotected)/accommodation/empty/accommodation-page-empty.svelte';
	import AccommodationPageError from '@/shared/components/pages/(unprotected)/accommodation/error/accommodation-page-error.svelte';

	// UTILS
	import { nightsBetween } from '@/shared/utils/dateUtils';

	// TYPES
	import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';
	import type { DateRange } from 'bits-ui';

	const slug = $derived(page.params.slug ?? '');

	const accommodationQuery = useQuery(
		api.tables.accommodations.queries.fetchAccommodationBySlugForBookSafe
			.fetchAccommodationBySlugForBookSafe,
		() => (slug ? { slug } : 'skip')
	);
	const accommodation = $derived(
		accommodationQuery.data as typesAccommodationEnriched | null | undefined
	);

	function toDate(value: string | null): DateValue | undefined {
		if (!value) return undefined;
		try {
			return parseDate(value);
		} catch {
			return undefined;
		}
	}

	// The trip selection arrives from the listing's Reserve button as query params; it seeds
	// local state once, then the guest edits dates/guests in place under "Your trip".
	// ponytail: local state only — edits don't sync to the URL (a refresh resets to the link's values).
	let dateRange = $state<DateRange>({
		start: toDate(page.url.searchParams.get('checkIn')),
		end: toDate(page.url.searchParams.get('checkOut'))
	});
	let adults = $state(Number(page.url.searchParams.get('adults') ?? '2') || 2);
	let children = $state(Number(page.url.searchParams.get('children') ?? '0') || 0);

	const checkIn = $derived(dateRange.start?.toString() ?? null);
	const checkOut = $derived(dateRange.end?.toString() ?? null);
	const hasDates = $derived(nightsBetween(checkIn, checkOut) > 0);
</script>

<SvelteHead
	title={m['BookAccommodationPage.SEO.title']({ accommodationTitle: accommodation?.title ?? '' })}
	description={m['BookAccommodationPage.SEO.description']()}
	noIndex
/>

{#if accommodationQuery.error}
	<AccommodationPageError />
{:else if accommodation === null}
	<AccommodationPageEmpty />
{:else if accommodation === undefined}
	<AccommodationPageLoading />
{:else}
	<div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
		<BookHeader {slug} instantBooking={accommodation.instantBooking} datesMissing={!hasDates} />

		<div class="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
			<!-- Left: trip recap + guest form (below the summary on mobile) -->
			<div class="order-2 min-w-0 space-y-8 lg:order-1">
				<BookDetails {accommodation} bind:dateRange bind:adults bind:children />

				<Separator />

				<BookGuestForm
					{accommodation}
					{checkIn}
					{checkOut}
					{adults}
					{children}
					datesMissing={!hasDates}
				/>
			</div>

			<!-- Right: sticky order summary (above the form on mobile) -->
			<aside class="order-1 lg:order-2">
				<div class="lg:sticky lg:top-20">
					<BookSummaryCard {accommodation} {checkIn} {checkOut} {adults} {children} />
				</div>
			</aside>
		</div>
	</div>
{/if}
