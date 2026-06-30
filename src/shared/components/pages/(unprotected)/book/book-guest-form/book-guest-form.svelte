<script lang="ts" module>
	// TYPES
	import type { PaymentMethod } from '@/features/bookings/data/paymentMethods';

	type GuestDetails = Record<string, unknown> & {
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
		specialRequests?: string;
		paymentMethod: PaymentMethod;
		checkIn: string;
		checkOut: string;
	};
</script>

<script lang="ts">
	// LIBRARIES
	import { getLocale } from '@/shared/lib/paraglide/runtime';
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints';

	// COMPONENTS
	import ConvexMutationForm from '@/shared/components/ui/mutation-form/convex-mutation-form.svelte';
	import BookPaymentField from './book-payment-field.svelte';
	import BookConfirmActionsField from './book-confirm-actions-field.svelte';

	// UTILS
	import { createBookingSchema } from '@/features/bookings/schemas/bookingsSchemas';
	import { bookGuestForm } from '@/features/bookings/forms/bookGuestForm';
	import { appGoto } from '@/utils/app-navigation';

	// TYPES
	import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';
	import type { ZodType } from 'zod';

	let {
		accommodation,
		checkIn,
		checkOut,
		adults,
		children,
		datesMissing = false
	}: {
		accommodation: typesAccommodationEnriched;
		checkIn: string | null;
		checkOut: string | null;
		adults: number;
		children: number;
		/** True when dates aren't selected yet. The button stays clickable — submitting
		    surfaces this as a message rather than leaving the button mysteriously disabled. */
		datesMissing?: boolean;
	} = $props();

	// Seeded once from the listing payment settings; the guest may change it locally.
	// svelte-ignore state_referenced_locally
	let values = $state<GuestDetails>({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		specialRequests: '',
		paymentMethod: accommodation.paymentMethod,
		checkIn: checkIn ?? '',
		checkOut: checkOut ?? ''
	});
	let attempted = $state(false);

	// Dates are picked in the sibling "Your trip" calendar and arrive as props; mirror them
	// into the form values so `createBookingSchema` validates them on submit. One-way only —
	// they're never rendered as fields, so the form never writes back.
	$effect(() => {
		values.checkIn = checkIn ?? '';
		values.checkOut = checkOut ?? '';
	});

	// Form fields are UI-named (firstName, …) and the guest counts live outside the form, so map
	// the validated values onto the mutation's `guest*` args and inject the listing context.
	const toBookingArgs = (v: GuestDetails) => ({
		apartmentSlug: accommodation.slug,
		hostId: accommodation.host.id,
		guestFirstName: v.firstName.trim(),
		guestLastName: v.lastName.trim(),
		guestEmail: v.email.trim(),
		guestPhone: v.phone.trim(),
		specialRequests: v.specialRequests?.trim() || undefined,
		checkInDate: v.checkIn,
		checkOutDate: v.checkOut,
		numberOfAdults: adults,
		numberOfChildren: children,
		paymentMethod: v.paymentMethod,
		instantBooking: accommodation.instantBooking,
		locale: getLocale()
	});

	const goToReservation = (data: unknown) => {
		const { bookingId } = data as { bookingId: string };
		return appGoto(UNPROTECTED_PAGE_ENDPOINTS.RESERVATION.replace(':id', bookingId));
	};
</script>

{#snippet paymentFields()}
	<BookPaymentField bind:paymentMethod={values.paymentMethod} />
{/snippet}

{#snippet confirmActions({ busy }: { busy: boolean })}
	<BookConfirmActionsField
		instantBooking={accommodation.instantBooking}
		paymentMethod={values.paymentMethod}
		{datesMissing}
		bind:attempted
		{busy}
	/>
{/snippet}

<ConvexMutationForm
	bind:values
	sections={bookGuestForm}
	schema={createBookingSchema as ZodType<GuestDetails>}
	runFunction={api.tables.bookings.mutations.createBooking.createBooking}
	mapArgs={toBookingArgs}
	onSuccess={goToReservation}
	resetOnSuccess={false}
	extraFields={paymentFields}
	actions={confirmActions}
	class="gap-8"
/>
