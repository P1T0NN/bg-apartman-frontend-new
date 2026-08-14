<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import { AlertDialog } from '@/components/ui/alert-dialog';
	import { Button } from '@/components/ui/button/index.js';
	import { Textarea } from '@/components/ui/textarea/index.js';
	import ConvexMutationForm from '@/components/ui/mutation-form/convex-mutation-form.svelte';

	// SCHEMAS
	import { declineBookingSchema } from '@/shared/features/booking/schemas/bookingsSchemas';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { typesDeclineBookingInput } from '@/shared/features/booking/schemas/bookingsSchemas';
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';
	import type { MutationFormFieldDef } from '@/components/ui/mutation-form/types';

	// LUCIDE ICONS
	import { Loader } from '@lucide/svelte';

	/**
	 * Controlled decline dialog. The host writes a mandatory reason (min 4 chars) and confirms;
	 * the mutation runs through `ConvexMutationForm` (validation + toast + error handling all
	 * shared), then `declineBooking` flips the status and emails the guest the reason.
	 *
	 * Opened from the reservations page when the detail sheet fires the `decline` action.
	 */
	let {
		booking,
		open = $bindable(false)
	}: {
		booking: typesBookingSafe | null;
		open?: boolean;
	} = $props();

	// The form validates the whole `declineBookingSchema` client-side — the exact schema the
	// `declineBooking` mutation re-validates at the Convex boundary. `bookingId`/`locale` ride
	// along in the values (no `mapArgs` needed), so there's a single validated payload; opening
	// the dialog fills in whichever booking is being declined.
	let values = $state<typesDeclineBookingInput>({
		bookingId: '' as Id<'bookings'>,
		declineReason: '',
		locale: 'en'
	});

	const reasonLength = $derived(values.declineReason.trim().length);

	const guestName = $derived(
		booking
			? `${booking.guestFirstName} ${booking.guestLastName}`
			: m['BookingsFeature.BookingsDetailSheet.DeclineBookingDialog.theGuest']()
	);

	const fields: MutationFormFieldDef[] = [
		{ id: 'declineReason', kind: 'textarea', label: m['BookingsFeature.BookingsDetailSheet.DeclineBookingDialog.reasonForDeclining']() }
	];
</script>

<AlertDialog
	bind:open
	hideTrigger
	class="ring-destructive/30"
	onOpenChange={(next) => {
		// Start every opening from a clean slate for whichever booking is being declined.
		if (next && booking) {
			values.bookingId = booking._id as Id<'bookings'>;
			values.declineReason = '';
		}
	}}
>
	<div class="alert-dialog__header">
		<h2 class="text-destructive">{m['BookingsFeature.BookingsDetailSheet.DeclineBookingDialog.title']()}</h2>
		<p>{m['BookingsFeature.BookingsDetailSheet.DeclineBookingDialog.body']({ guest: guestName })}</p>
	</div>

	{#if booking}
		<ConvexMutationForm
			bind:values
			schema={declineBookingSchema}
			{fields}
			runFunction={api.tables.bookings.mutations.declineBooking.declineBooking}
			onSuccess={() => {
				open = false;
			}}
			customFields={{ declineReason: reasonField }}
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
		placeholder={m['BookingsFeature.BookingsDetailSheet.DeclineBookingDialog.reasonPlaceholder']()}
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
			{m['BookingsFeature.BookingsDetailSheet.DeclineBookingDialog.keepRequest']()}
		</Button>

		<!-- Never disabled on validity: clicking must SAY what's wrong (the form's own
		     field errors + toast), not silently refuse. -->
		<Button type="submit" variant="destructive" disabled={busy}>
			{#if busy}
				<Loader class="h-3 w-3 animate-spin" />
			{/if}
			{m['BookingsFeature.BookingsDetailSheet.DeclineBookingDialog.declineRequest']()}
		</Button>
	</div>
{/snippet}
