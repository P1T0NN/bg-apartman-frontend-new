<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import { AlertDialog } from '@/components/ui/alert-dialog';
	import { Button } from '@/components/ui/button/index.js';
	import { Textarea } from '@/components/ui/textarea/index.js';
	import ConvexMutationForm from '@/components/ui/mutation-form/convex-mutation-form.svelte';

	// SCHEMAS
	import { cancelBookingAdminSchema } from '@/shared/features/booking/schemas/bookingsSchemas';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { typesCancelBookingAdminInput } from '@/shared/features/booking/schemas/bookingsSchemas';
	import type { AdminBookingRow } from '@/convex/tables/bookings/queries/listBookingsAdmin';
	import type { MutationFormFieldDef } from '@/components/ui/mutation-form/types';

	// LUCIDE ICONS
	import { Loader } from '@lucide/svelte';

	/**
	 * The admin emergency brake (AdminPagesSystemDesign.md §3). Reason required — both
	 * parties receive it by email — and the mutation performs the refund or hold release
	 * through the adapter automatically, per PaymentsSystemDesign.md §4's matrix.
	 *
	 * Same dialog shape as the host's decline/cancel: the whole shared schema validates
	 * client-side and is re-validated at the Convex boundary.
	 */
	let {
		booking,
		open = $bindable(false)
	}: {
		booking: AdminBookingRow | null;
		open?: boolean;
	} = $props();

	// Opening the dialog fills in whichever booking is being cancelled.
	let values = $state<typesCancelBookingAdminInput>({
		bookingId: '' as Id<'bookings'>,
		cancelReason: '',
		locale: 'en'
	});

	const reasonLength = $derived(values.cancelReason.trim().length);

	const fields: MutationFormFieldDef[] = [
		{
			id: 'cancelReason',
			kind: 'textarea',
			label: m['AdminBookingsPage.AdminCancelBookingDialog.reasonForCancelling']()
		}
	];
</script>

<AlertDialog
	bind:open
	hideTrigger
	class="ring-destructive/30"
	onOpenChange={(next) => {
		if (next && booking) {
			values.bookingId = booking._id as Id<'bookings'>;
			values.cancelReason = '';
		}
	}}
>
	<div class="alert-dialog__header">
		<h2 class="text-destructive">{m['AdminBookingsPage.AdminCancelBookingDialog.cancelThisBooking']()}</h2>
		<p>{m['AdminBookingsPage.AdminCancelBookingDialog.notificationBody']()}</p>
	</div>

	{#if booking}
		<ConvexMutationForm
			bind:values
			schema={cancelBookingAdminSchema}
			{fields}
			runFunction={api.tables.bookings.mutations.cancelBookingAdmin.cancelBookingAdmin}
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
		placeholder={m['AdminBookingsPage.AdminCancelBookingDialog.reasonPlaceholder']()}
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
			{m['AdminBookingsPage.AdminCancelBookingDialog.keepBooking']()}
		</Button>
		<!-- Never disabled on validity: clicking must SAY what's wrong (the form's own
		     field errors + toast), not silently refuse. -->
		<Button type="submit" variant="destructive" disabled={busy}>
			{#if busy}
				<Loader class="h-3 w-3 animate-spin" />
			{/if}
			{m['AdminBookingsPage.AdminCancelBookingDialog.cancelBooking']()}
		</Button>
	</div>
{/snippet}
