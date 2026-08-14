<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { appGoto } from '@/utils/app-navigation.js';
	// SVELTEKIT

	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import ConvexMutationForm from '@/components/ui/mutation-form/convex-mutation-form.svelte';
	import { Button } from '@/components/ui/button/index.js';

	// SCHEMAS
	import {
		findMyReservationSchema,
		type FindMyReservationInput
	} from '@/shared/features/booking/schemas/bookingsSchemas';

	// TYPES
	import type { MutationFormFieldDef } from '@/components/ui/mutation-form/types.js';
	import type { Id } from '@/convex/_generated/dataModel';

	// LUCIDE ICONS
	import SearchIcon from '@lucide/svelte/icons/search';

	const fields: MutationFormFieldDef[] = [
		{
			id: 'bookingCode',
			kind: 'input',
			label: m['ReservationsPage.ReservationsForm.bookingCode'](),
			placeholder: 'BK7X9M2P4Q',
			description: m['ReservationsPage.ReservationsForm.bookingCodeDescription'](),
			required: true
		},
		{
			id: 'email',
			kind: 'input',
			type: 'email',
			label: m['ReservationsPage.ReservationsForm.email'](),
			placeholder: 'you@example.com',
			description: m['ReservationsPage.ReservationsForm.emailDescription'](),
			autocomplete: 'email',
			required: true
		}
	];

	let values = $state<FindMyReservationInput>({ bookingCode: '', email: '' });
</script>

<ConvexMutationForm
	class="mt-10"
	{fields}
	bind:values
	schema={findMyReservationSchema}
	runFunction={api.tables.bookings.mutations.findMyReservation.findMyReservation}
	onSuccess={(data) => {
		const bookingId = (data as { bookingId?: Id<'bookings'> } | undefined)?.bookingId;
		if (bookingId) appGoto(`/reservations/${bookingId}`);
	}}
>
	{#snippet actions({ busy }: { busy: boolean })}
		<Button type="submit" size="lg" class="w-full gap-2" disabled={busy}>
			<SearchIcon class="size-4" />
			{m['ReservationsPage.ReservationsForm.findMyReservation']()}
		</Button>
	{/snippet}
</ConvexMutationForm>
