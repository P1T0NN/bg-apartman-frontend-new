<script lang="ts">
	// SVELTEKIT
	import { goto } from '$app/navigation';

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
			label: 'Booking code',
			placeholder: 'BK7X9M2P4Q',
			description: 'The code at the top of your confirmation email.',
			required: true
		},
		{
			id: 'email',
			kind: 'input',
			type: 'email',
			label: 'Email',
			placeholder: 'you@example.com',
			description: 'The address you booked with.',
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
		if (bookingId) goto(`/reservations/${bookingId}`);
	}}
>
	{#snippet actions({ busy }: { busy: boolean })}
		<Button type="submit" size="lg" class="w-full gap-2" disabled={busy}>
			<SearchIcon class="size-4" />
			Find my reservation
		</Button>
	{/snippet}
</ConvexMutationForm>
