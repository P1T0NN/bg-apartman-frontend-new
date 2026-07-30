<script lang="ts">
	// SVELTEKIT
	import { goto } from '$app/navigation';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import Section from '@/components/ui/section/section.svelte';
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
	import TicketIcon from '@lucide/svelte/icons/ticket';
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

<SvelteHead
	title="Find your reservation"
	description="Lost the email? Look your booking up with your booking code and email address."
	noIndex
/>

<!-- No loader: the page is a form, it resolves on submit (GuestSystemDesign.md §7). -->
<Section class="min-h-dvh" yPadding="lg" containerClass="max-w-md">
	<header>
		<div class="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
			<TicketIcon class="size-6" aria-hidden="true" />
		</div>

		<h1
			class="mt-5 font-display text-3xl font-medium tracking-tight text-balance text-foreground sm:text-4xl"
		>
			Find your reservation
		</h1>

		<p class="mt-3 text-pretty text-muted-foreground">
			Lost the email? Enter your booking code and the email you booked with, and we'll take you
			straight to your reservation.
		</p>
	</header>

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

	<p class="mt-6 text-sm text-muted-foreground">
		Still stuck? <a href="/contact" class="text-foreground underline underline-offset-4">
			Contact us
		</a> and we'll look it up for you.
	</p>
</Section>
