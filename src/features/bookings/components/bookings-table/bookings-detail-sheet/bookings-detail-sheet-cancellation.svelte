<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	// LUCIDE ICONS
	import BanIcon from '@lucide/svelte/icons/ban';

	let { booking }: { booking: typesBookingSafe } = $props();

	const cancelledByLabel = $derived.by(() => {
		const role = booking.cancelledBy ?? 'guest';
		const roles: Record<string, string> = {
			guest: m['BookingsFeature.BookingsDetailSheet.BookingsDetailSheetCancellation.guest'](),
			host: m['BookingsFeature.BookingsDetailSheet.BookingsDetailSheetCancellation.host'](),
			system: m['BookingsFeature.BookingsDetailSheet.BookingsDetailSheetCancellation.system'](),
			admin: m['BookingsFeature.BookingsDetailSheet.BookingsDetailSheetCancellation.admin']()
		};
		return m['BookingsFeature.BookingsDetailSheet.BookingsDetailSheetCancellation.cancelledBy']({ by: roles[role] ?? role });
	});
</script>

<section class="flex gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm">
	<BanIcon class="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />

	<div class="space-y-0.5">
		<p class="font-medium text-destructive">
			{#if booking.status === 'declined'}
				{m['BookingsFeature.BookingsDetailSheet.BookingsDetailSheetCancellation.declinedByHost']()}
			{:else if booking.status === 'auto_declined'}
				{m['BookingsFeature.BookingsDetailSheet.BookingsDetailSheetCancellation.requestExpired']()}
			{:else}
				{cancelledByLabel}
			{/if}
		</p>

		{#if booking.cancelReason}
			<p class="text-muted-foreground">{booking.cancelReason}</p>
		{/if}
	</div>
</section>
