<script lang="ts">
	import { m } from '@/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import { AlertDialog } from '@/components/ui/alert-dialog';
	import { Button } from '@/components/ui/button/index.js';
	import { Textarea } from '@/components/ui/textarea/index.js';
	import ConvexMutationForm from '@/components/ui/mutation-form/convex-mutation-form.svelte';

	// SCHEMAS
	import { cancelBookingOwnerSchema } from '@/shared/features/booking/schemas/bookingsSchemas';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { typesCancelBookingOwnerInput } from '@/shared/features/booking/schemas/bookingsSchemas';
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';
	import type { MutationFormFieldDef } from '@/components/ui/mutation-form/types';

	// LUCIDE ICONS
	import { Loader } from '@lucide/svelte';

	/**
	 * Controlled cancel dialog for a host cancelling a *confirmed* booking they own. The
	 * host writes a mandatory reason (min 4 chars — the guest reads it in their email and on
	 * the reservation page, BookingSystemDesign.md §8), then `cancelBookingOwner` flips the
	 * status, refunds if paid, and emails both sides.
	 *
	 * Opened from the reservations page when the detail sheet fires the `cancel` action.
	 */
	let {
		booking,
		open = $bindable(false)
	}: {
		booking: typesBookingSafe | null;
		open?: boolean;
	} = $props();

	// The form validates the whole `cancelBookingOwnerSchema` client-side — the exact schema
	// the mutation re-validates at the Convex boundary (declineBooking pattern). Opening the
	// dialog fills in whichever booking is being cancelled.
	let values = $state<typesCancelBookingOwnerInput>({
		bookingId: '' as Id<'bookings'>,
		cancelReason: '',
		locale: 'en'
	});

	const guestName = $derived(
		booking
			? `${booking.guestFirstName} ${booking.guestLastName}`
			: m['BookingsFeature.BookingsDetailSheet.CancelBookingDialog.theGuest']()
	);

	const reasonLength = $derived(values.cancelReason.trim().length);

	const fields: MutationFormFieldDef[] = [
		{ id: 'cancelReason', kind: 'textarea', label: m['BookingsFeature.BookingsDetailSheet.CancelBookingDialog.reasonForCancelling']() }
	];
</script>

<AlertDialog
	bind:open
	hideTrigger
	class="ring-destructive/30"
	onOpenChange={(next) => {
		// Start every opening from a clean slate for whichever booking is being cancelled.
		if (next && booking) {
			values.bookingId = booking._id as Id<'bookings'>;
			values.cancelReason = '';
		}
	}}
>
	<div class="alert-dialog__header">
		<h2 class="text-destructive">{m['BookingsFeature.BookingsDetailSheet.CancelBookingDialog.title']()}</h2>
		<!-- Names the concrete consequence: who is emailed, who is refunded, what it costs
		     the host to do this often (HostSystemDesign.md §3, BSD §4). The reason below is
		     emailed to the guest verbatim. -->
		<p>
			{#if booking?.paymentMethod === 'online'}
				{m['BookingsFeature.BookingsDetailSheet.CancelBookingDialog.bodyOnline']({ guest: guestName })}
			{:else}
				{m['BookingsFeature.BookingsDetailSheet.CancelBookingDialog.bodyCash']({ guest: guestName })}
			{/if}
		</p>
	</div>

	{#if booking}
		<ConvexMutationForm
			bind:values
			schema={cancelBookingOwnerSchema}
			{fields}
			runFunction={api.tables.bookings.mutations.cancelBookingOwner.cancelBookingOwner}
			onSuccess={() => {
				open = false;
			}}
			customFields={{ cancelReason: reasonField }}
			actions={formActions}
			class="gap-4"
		/>
	{/if}
</AlertDialog>

{#snippet reasonField({
	value,
	setValue,
	inputId,
	error
}: {
	value: unknown;
	setValue: (next: unknown) => void;
	inputId: string;
	error: string | undefined;
})}
	<Textarea
		id={inputId}
		value={String(value ?? '')}
		oninput={(e) => setValue(e.currentTarget.value)}
		maxlength={500}
		rows={4}
		placeholder={m['BookingsFeature.BookingsDetailSheet.CancelBookingDialog.reasonPlaceholder']()}
		aria-invalid={!!error}
	/>
	<span
		class="self-end text-xs tabular-nums {reasonLength >= 4
			? 'text-muted-foreground'
			: 'text-destructive'}"
		aria-live="polite"
	>
		{Math.min(reasonLength, 4)}/4
	</span>
{/snippet}

{#snippet formActions({ busy }: { busy: boolean })}
	<div class="alert-dialog__footer">
		<Button type="button" variant="outline" onclick={() => (open = false)} disabled={busy}>
			{m['BookingsFeature.BookingsDetailSheet.CancelBookingDialog.keepBooking']()}
		</Button>
		<!-- Never disabled on validity: clicking must SAY what's wrong (the form's own
		     field errors + toast), not silently refuse. -->
		<Button type="submit" variant="destructive" disabled={busy}>
			{#if busy}
				<Loader class="h-3 w-3 animate-spin" />
			{/if}
			{m['BookingsFeature.BookingsDetailSheet.CancelBookingDialog.cancelBooking']()}
		</Button>
	</div>
{/snippet}
