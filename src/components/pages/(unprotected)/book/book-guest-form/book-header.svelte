<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';

	// COMPONENTS
	import { Link } from '@/components/ui/link/index.js';

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
			href={appHref(UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION.replace(':slug', slug))}
			class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
		>
			<ChevronLeftIcon class="size-4" aria-hidden="true" />
			{m['BookPage.BookHeader.backToAccommodation']()}
		</Link>

		<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">
			{#if instantBooking}
				{m['BookPage.BookHeader.confirmBooking']()}
			{:else}
				{m['BookPage.BookHeader.requestToBook']()}
			{/if}
		</h1>
	</div>

	{#if datesMissing}
		<div
			class="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-foreground/90"
		>
			{m['BookPage.BookHeader.datesMissing']()}{' '}
			<span class="font-medium">{m['BookPage.BookHeader.yourTrip']()}</span>{' '}
			{m['BookPage.BookHeader.datesMissingSuffix']()}
		</div>
	{/if}
</div>
