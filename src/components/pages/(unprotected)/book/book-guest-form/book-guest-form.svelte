<script lang="ts" module>
	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	type GuestDetails = Record<string, unknown> & {
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
		specialRequests?: string;
		paymentMethod: Doc<'bookings'>['paymentMethod'];
		checkIn: string;
		checkOut: string;
	};
</script>

<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import ConvexMutationForm from '@/components/ui/mutation-form/convex-mutation-form.svelte';
	import BookPaymentField from './book-payment-field.svelte';
	import BookConfirmActionsField from './book-confirm-actions-field.svelte';

	// UTILS
	import { createBookingFormSchema } from '@/shared/features/booking/schemas/bookingsSchemas';
	import { bookGuestForm } from '@/features/bookings/forms/bookGuestForm';
	import { ONLINE_PAYMENTS_ENABLED } from '@/features/bookings/data/paymentMethods';
	import { appGoto } from '@/utils/app-navigation';
	import { safeAction } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
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

	const convex = useConvexClient();

	// While the provider is dark, cash is the only thing a guest can be offered — even if the
	// listing still says `online`/`both` (PaymentsSystemDesign.md §8). UI half of the gate.
	const accepted = $derived(ONLINE_PAYMENTS_ENABLED ? accommodation.paymentMethod : 'cash');

	// Seeded once from the accommodation payment settings; the guest may change it locally.
	// `both` means the guest chooses — default to cash, the picker shows both options.
	// svelte-ignore state_referenced_locally
	let values = $state<GuestDetails>({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		specialRequests: '',
		paymentMethod: accepted === 'both' ? 'cash' : accepted,
		checkIn: checkIn ?? '',
		checkOut: checkOut ?? ''
	});
	let attempted = $state(false);

	// Dates are picked in the sibling "Your trip" calendar and arrive as props; mirror them
	// into the form values so `createBookingFormSchema` validates them on submit. One-way only —
	// they're never rendered as fields, so the form never writes back.
	$effect(() => {
		values.checkIn = checkIn ?? '';
		values.checkOut = checkOut ?? '';
	});

	// Form fields are UI-named (firstName, …) and the guest counts live outside the form, so map
	// the validated values onto the mutation's `guest*` args and inject the accommodation context.
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
		locale: 'en'
	});

	/**
	 * Cash bookings land on their reservation page immediately. Online ones have an
	 * `awaiting` row and nothing else yet — they go to the provider-hosted checkout first
	 * (PaymentsSystemDesign.md §3), and the reservation page picks them up on the way back,
	 * flipping the moment the authorization webhook lands.
	 *
	 * If the session can't be opened we still send them to the reservation page: the row is
	 * reaped at its deadline and the page tells them plainly that nothing was charged.
	 */
	const goToReservation = async (data: unknown) => {
		const { bookingId, checkoutRequired } = data as {
			bookingId: string;
			checkoutRequired?: boolean;
		};

		if (checkoutRequired) {
			const result = await safeAction(convex, api.payments.checkout.createCheckoutSession, {
				bookingId: bookingId as Id<'bookings'>
			});
			if (result?.success && result.data?.checkoutUrl) {
				window.location.href = result.data.checkoutUrl;
				return;
			}
			if (result) toastResult(result);
		}

		return appGoto(UNPROTECTED_PAGE_ENDPOINTS.RESERVATION.replace(':id', bookingId));
	};
</script>

{#snippet paymentFields()}
	<BookPaymentField bind:paymentMethod={values.paymentMethod} {accepted} />
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
	schema={createBookingFormSchema as unknown as ZodType<GuestDetails>}
	runFunction={api.tables.bookings.mutations.createBooking.createBooking}
	mapArgs={toBookingArgs}
	onSuccess={goToReservation}
	resetOnSuccess={false}
	extraFields={paymentFields}
	actions={confirmActions}
	class="gap-8"
/>
