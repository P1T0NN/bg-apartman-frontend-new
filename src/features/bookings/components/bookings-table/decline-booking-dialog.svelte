<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { m } from '@/shared/lib/paraglide/messages';
	import { getLocale } from '@/shared/lib/paraglide/runtime';

	// COMPONENTS
	import { AlertDialog } from '@/shared/components/ui/alert-dialog';
	import { Button } from '@/shared/components/ui/button/index.js';
	import { Textarea } from '@/shared/components/ui/textarea/index.js';
	import ConvexMutationForm from '@/shared/components/ui/mutation-form/convex-mutation-form.svelte';

	// SCHEMAS
	import { declineBookingSchema } from '@/shared/features/booking/schemas/declineBookingSchema';

	// TYPES
	import type { z } from 'zod';
	import type { Id } from '@/convex/_generated/dataModel';
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';
	import type { MutationFormFieldDef } from '@/shared/components/ui/mutation-form/types';

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

	type DeclineBookingValues = z.infer<typeof declineBookingSchema>;

	// The form validates the whole `declineBookingSchema` client-side — the exact schema the
	// `declineBooking` mutation re-validates at the Convex boundary. `bookingId`/`locale` ride
	// along in the values (no `mapArgs` needed), so there's a single validated payload.
	function freshValues(): DeclineBookingValues {
		return {
			bookingId: (booking?._id ?? '') as Id<'bookings'>,
			declineReason: '',
			locale: getLocale()
		};
	}

	let values = $state<DeclineBookingValues>(freshValues());

	const reasonLength = $derived(values.declineReason.trim().length);
	const isValid = $derived(declineBookingSchema.safeParse(values).success);

	const fields: MutationFormFieldDef[] = [
		{ id: 'declineReason', kind: 'textarea', label: m['DeclineBookingDialog.reasonLabel']() }
	];
</script>

<AlertDialog
	bind:open
	hideTrigger
	class="ring-destructive/30"
	onOpenChange={(next) => {
		// Start every opening from a clean slate for whichever booking is being declined.
		if (next) values = freshValues();
	}}
>
	<div class="alert-dialog__header">
		<h2 class="text-destructive">
			{m['DeclineBookingDialog.title']()}
		</h2>
		<p>
			{m['DeclineBookingDialog.description']({
				guest: booking ? `${booking.guestFirstName} ${booking.guestLastName}` : ''
			})}
		</p>
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
		placeholder={m['DeclineBookingDialog.reasonPlaceholder']()}
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
			{m['DeclineBookingDialog.cancel']()}
		</Button>
		<Button type="submit" variant="destructive" disabled={busy || !isValid}>
			{#if busy}
				<Loader class="h-3 w-3 animate-spin" />
			{/if}
			{m['DeclineBookingDialog.confirm']()}
		</Button>
	</div>
{/snippet}
