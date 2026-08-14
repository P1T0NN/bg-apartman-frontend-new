<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	// LUCIDE ICONS
	import MailIcon from '@lucide/svelte/icons/mail';
	import PhoneIcon from '@lucide/svelte/icons/phone';

	let {
		booking,
		hostView
	}: {
		booking: typesBookingSafe;
		/** The actionable (host/admin) context — a guest reading their own booking always sees
		 *  the details they typed. */
		hostView: boolean;
	} = $props();

	// Contact details unlock at `confirmed` — before that the guest is an applicant, not a
	// contact (HostSystemDesign.md §3). Declined/withdrawn requests never unlock; a cancelled
	// booking keeps them, because it was a real stay the host may still need to sort out.
	// ponytail: UI-level gate — the row payload still carries the fields, which is what the
	// table's search box matches on. Server-side redaction is the upgrade if it ever matters.
	const CONTACTABLE_STATUSES = new Set(['confirmed', 'checked_in', 'checked_out', 'cancelled']);
	const visible = $derived(!hostView || CONTACTABLE_STATUSES.has(booking.status));
</script>

<section class="space-y-2">
	<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
		{m['BookingsFeature.BookingsDetailSheet.BookingsDetailSheetGuestContact.title']()}
	</h3>
	{#if visible}
		<div class="grid gap-2">
			<a
				href={`mailto:${booking.guestEmail}`}
				class="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted"
			>
				<MailIcon class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
				<span class="truncate">{booking.guestEmail}</span>
			</a>

			<a
				href={`tel:${booking.guestPhone.replace(/\s+/g, '')}`}
				class="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted"
			>
				<PhoneIcon class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
				<span class="truncate">{booking.guestPhone}</span>
			</a>
		</div>
	{:else}
		<p class="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
			{#if booking.status === 'pending'}
				{m['BookingsFeature.BookingsDetailSheet.BookingsDetailSheetGuestContact.emailAppearsAfterConfirm']()}
			{:else}
				{m['BookingsFeature.BookingsDetailSheet.BookingsDetailSheetGuestContact.detailsStayClosed']()}
			{/if}
		</p>
	{/if}
</section>
