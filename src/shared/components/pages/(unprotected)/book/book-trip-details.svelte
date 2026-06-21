<script lang="ts">
	// COMPONENTS
	import { Link } from '@/shared/components/ui/link/index.js';

	// UTILS
	import {
		formatDateRange,
		formatGuestsShort,
		nightsBetween
	} from '@/features/accommodations/utils/accommodationPresentation';

	let {
		checkIn,
		checkOut,
		adults,
		children,
		editHref
	}: {
		checkIn: string | null;
		checkOut: string | null;
		adults: number;
		children: number;
		/** Localized href back to the listing, where dates/guests are chosen. */
		editHref: string;
	} = $props();

	const nights = $derived(nightsBetween(checkIn, checkOut));
</script>

<section class="space-y-4">
	<h2 class="text-lg font-semibold tracking-tight">Your trip</h2>

	<div class="space-y-4">
		<div class="flex items-start justify-between gap-4">
			<div>
				<p class="text-sm font-medium">Dates</p>
				<p class="text-sm text-muted-foreground">
					{#if checkIn && checkOut}
						{formatDateRange(checkIn, checkOut)} · {nights} {nights === 1 ? 'night' : 'nights'}
					{:else}
						Not selected yet
					{/if}
				</p>
			</div>
			<Link href={editHref} class="text-sm font-medium underline underline-offset-4">Edit</Link>
		</div>

		<div class="flex items-start justify-between gap-4">
			<div>
				<p class="text-sm font-medium">Guests</p>
				<p class="text-sm text-muted-foreground">{formatGuestsShort(adults, children)}</p>
			</div>
			<Link href={editHref} class="text-sm font-medium underline underline-offset-4">Edit</Link>
		</div>
	</div>
</section>
