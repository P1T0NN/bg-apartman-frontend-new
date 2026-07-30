<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

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
			href={UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION.replace(':slug', slug)}
			class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
		>
			<ChevronLeftIcon class="size-4" aria-hidden="true" />
			Back to accommodation
		</Link>

		<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">
			{#if instantBooking}
				Confirm your booking
			{:else}
				Request to book
			{/if}
		</h1>
	</div>

	{#if datesMissing}
		<div
			class="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-foreground/90"
		>
			You haven’t picked your dates yet — add them under
			<span class="font-medium">Your trip</span>
			to see the full price and confirm.
		</div>
	{/if}
</div>
