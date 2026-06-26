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
	};
</script>

<script lang="ts">
	// LIBRARIES
	import { useConvexClient } from 'convex-svelte';
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants';

	// COMPONENTS
	import MutationForm from '@/shared/components/ui/mutation-form/mutation-form.svelte';
	import BookPaymentField from './book-payment-field.svelte';
	import BookConfirmActionsField from './book-confirm-actions-field.svelte';

	// UTILS
	import { bookGuestSchema } from '@/features/bookings/schemas/bookGuestSchema';
	import { bookGuestForm } from '@/features/bookings/forms/bookGuestForm';
	import { nightsBetween } from '@/shared/utils/dateUtils';
	import { calculatePrice } from '@/shared/features/pricing/utils/calculatePrice';
	import { safeMutation } from '@/shared/utils/convexHelpers';
	import { appGoto } from '@/shared/utils/app-navigation';

	// TYPES
	import type { AccommodationDetail } from '@/features/accommodations/data/accommodationDummyData';
	import type { MutationFormSubmitHandler } from '@/shared/components/ui/mutation-form/types';
	import type { ZodType } from 'zod';

	let {
		accommodation,
		checkIn,
		checkOut,
		adults,
		children,
		datesMissing = false
	}: {
		accommodation: AccommodationDetail;
		checkIn: string | null;
		checkOut: string | null;
		adults: number;
		children: number;
		/** True when dates aren't selected yet. The button stays clickable — submitting
		    surfaces this as a message rather than leaving the button mysteriously disabled. */
		datesMissing?: boolean;
	} = $props();

	const convex = useConvexClient();

	// Seeded once from the listing payment settings; the guest may change it locally.
	// svelte-ignore state_referenced_locally
	let values = $state<GuestDetails>({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		specialRequests: '',
		paymentMethod: accommodation.paymentMethod
	});
	let attempted = $state(false);

	const confirmLabel = $derived(
		accommodation.instantBooking ? 'Confirm reservation' : 'Request to book'
	);

	const submitGuestDetails: MutationFormSubmitHandler<GuestDetails> = async (
		_args,
		submittedValues
	) => {
		attempted = true;

		if (datesMissing || !checkIn || !checkOut) return false;

		const quote = calculatePrice(accommodation, nightsBetween(checkIn, checkOut));

		const result = await safeMutation(
			convex,
			api.tables.bookings.mutations.createBooking.createBooking,
			{
				apartmentSlug: accommodation.slug,
				hostId: accommodation.host.id,
				guestFirstName: submittedValues.firstName.trim(),
				guestLastName: submittedValues.lastName.trim(),
				guestEmail: submittedValues.email.trim(),
				guestPhone: submittedValues.phone.trim(),
				specialRequests: submittedValues.specialRequests?.trim() || undefined,
				checkInDate: checkIn,
				checkOutDate: checkOut,
				numberOfAdults: adults,
				numberOfChildren: children,
				subtotal: quote.accommodationTotal,
				cleaningFee: quote.cleaningFee,
				paymentMethod: submittedValues.paymentMethod,
				instantBooking: accommodation.instantBooking
			}
		);

		if (!result?.success || !result.data) return false;

		await appGoto(UNPROTECTED_PAGE_ENDPOINTS.RESERVATION.replace(':id', result.data.bookingId));
		return true;
	};
</script>

{#snippet paymentFields()}
	<BookPaymentField paymentMethod={values.paymentMethod} />
{/snippet}

{#snippet confirmActions({ busy }: { busy: boolean })}
	<BookConfirmActionsField
		{confirmLabel}
		paymentMethod={values.paymentMethod}
		{datesMissing}
		bind:attempted
		{busy}
	/>
{/snippet}

<MutationForm
	bind:values
	sections={bookGuestForm}
	schema={bookGuestSchema as ZodType<GuestDetails>}
	onSubmit={submitGuestDetails}
	resetOnSuccess={false}
	extraFields={paymentFields}
	actions={confirmActions}
	class="gap-8"
/>
