<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints';

	// COMPONENTS
	import { Link } from '@/shared/components/ui/link/index.js';

	// LUCIDE ICONS
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';

	let {
		slug,
		instantBooking,
		datesMissing = false
	}: {
		slug: string;
		instantBooking: boolean;
		datesMissing?: boolean;
	} = $props();
</script>

<div class="mb-6 space-y-6">
	<div class="space-y-3">
		<Link
			href={UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION.replace(':slug', slug)}
			class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
		>
			<ChevronLeftIcon class="size-4" aria-hidden="true" />
			{m['BookAccommodationPage.BookHeader.backToListing']()}
		</Link>

		<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">
			{#if instantBooking}
				{m['BookAccommodationPage.BookHeader.confirmYourBooking']()}
			{:else}
				{m['BookAccommodationPage.BookHeader.requestToBook']()}
			{/if}
		</h1>
	</div>

	{#if datesMissing}
		<div
			class="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-foreground/90"
		>
			{m['BookAccommodationPage.BookHeader.youHavenTickedDates']()}
			<span class="font-medium">{m['BookAccommodationPage.BookHeader.yourTrip']()}</span> {m['BookAccommodationPage.BookHeader.toSeeTheFullPriceAndConfirm']()}
		</div>
	{/if}
</div>
