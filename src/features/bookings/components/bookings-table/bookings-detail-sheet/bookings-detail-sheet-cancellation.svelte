<script lang="ts">
	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	// LUCIDE ICONS
	import BanIcon from '@lucide/svelte/icons/ban';

	let { booking }: { booking: typesBookingSafe } = $props();
</script>

<section class="flex gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm">
	<BanIcon class="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
	
	<div class="space-y-0.5">
		<p class="font-medium text-destructive">
			{#if booking.status === 'declined'}
				Declined by host
			{:else if booking.status === 'auto_declined'}
				Request expired
			{:else}
				Cancelled by {booking.cancelledBy ?? 'guest'}
			{/if}
		</p>

		{#if booking.cancelReason}
			<p class="text-muted-foreground">{booking.cancelReason}</p>
		{/if}
	</div>
</section>
