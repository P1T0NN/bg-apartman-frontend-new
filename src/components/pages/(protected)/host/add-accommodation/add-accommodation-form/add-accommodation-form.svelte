<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import ConvexMutationForm from '@/components/ui/mutation-form/convex-mutation-form.svelte';
	import PlacesAutocomplete from '@/components/ui/places-autocomplete/places-autocomplete.svelte';
	import LocationMap from '@/components/ui/location-map/location-map.svelte';
	import AmenitiesField from '@/components/pages/(protected)/host/add-accommodation/amenities-field.svelte';
	import PaymentMethodField from '@/components/pages/(protected)/host/add-accommodation/payment-method-field.svelte';
	import MonetizationField from '@/components/pages/(protected)/host/add-accommodation/monetization-field.svelte';

	// SCHEMAS
	import {
		addAccommodationSchema,
		createAccommodationSchema
	} from '@/shared/features/accommodation/schemas/accommodationsSchemas';

	// FORMS
	import { addAccommodationForm } from '@/features/accommodations/forms/addAccommodationForm';

	// UTILS
	import { appGoto } from '@/utils/app-navigation';
	import {
		applyRegionToValues,
		applyStreetToValues
	} from '@/features/accommodations/utils/applyPlaceToLocationValues';

	// TYPES
	import type { typesAddAccommodationForm } from '@/shared/features/accommodation/types/accommodationTypes';
	import type { RegionBounds } from '@/lib/google-maps/places';
	import type { ZodType } from 'zod';

	const addAccommodationInitialValues: typesAddAccommodationForm = {
		title: '',
		type: '',
		description: '',

		placeId: '',
		address: '',
		addressNumber: '',
		city: '',
		country: '',
		coordinates: undefined,
		timeZone: '',

		bedrooms: '',
		bathrooms: '',
		maxGuests: '',
		squareMeters: '',

		pricePerNight: '',
		cleaningFee: '',
		weekendPremium: '',
		discountAmount: '',
		weeklyDiscount: '',

		minReservationDays: '1',
		maxReservationDays: '',
		checkInTime: '15:00',
		checkOutTime: '12:00',
		quietHoursStart: '',
		quietHoursEnd: '',

		instantBooking: false,
		paymentMethod: 'cash',
		monetization: undefined,
		sameDayReservation: false,
		singleDayReservation: false,
		petsAllowed: false,
		smokingAllowed: false,
		partiesAllowed: false,

		amenities: [],
		houseRules: '',

		photos: []
	};

	let values = $state<typesAddAccommodationForm>(structuredClone(addAccommodationInitialValues));

	// Viewport of the picked country/city — scopes the street search to that region.
	let regionViewport = $state<RegionBounds | undefined>();
	const regionSelected = $derived(Boolean(values.city || values.country));

	const goToMyAccommodations = () => appGoto(PROTECTED_PAGE_ENDPOINTS.MY_ACCOMMODATIONS);
</script>

<!-- City autocomplete — cities only (country shown as secondary text). On select it fills
     city/country, resolves `placeId` (the merged city+country search key and required gate) and
     captures the region viewport for the street search. Editing the text clears the id, so the
     host must pick from the list — typing a name alone never sets it. -->
{#snippet regionField({
	inputId,
	setValue
}: {
	inputId: string;
	setValue: (next: unknown) => void;
})}
	<PlacesAutocomplete
		id={inputId}
		variant="city"
		placeholder="Search your city"
		onInput={() => setValue('')}
		onSelect={(place) => {
			void applyRegionToValues(values, place, setValue, (vp) => (regionViewport = vp ?? undefined));
		}}
	/>
{/snippet}

<!-- Street autocomplete — disabled until a city is picked, then restricted to that city's
     viewport. On select it fills the street name, map pin and timezone. -->
{#snippet streetField({
	inputId,
	setValue
}: {
	inputId: string;
	setValue: (next: unknown) => void;
})}
	<PlacesAutocomplete
		id={inputId}
		variant="address"
		disabled={!regionSelected}
		locationRestriction={regionViewport}
		placeholder={regionSelected ? 'Search street name' : 'Pick a city first'}
		bind:value={values.address}
		onSelect={(place) => applyStreetToValues(values, place, setValue)}
	/>
{/snippet}

<!-- Read-only map showing the pin from the selected address's coordinates. -->
{#snippet mapField({ value }: { value: unknown })}
	{@const coords = value as { lat: number; lng: number } | undefined}
	<LocationMap lat={coords?.lat} lng={coords?.lng} />
{/snippet}

{#snippet amenitiesField({
	value,
	setValue,
	error
}: {
	value: unknown;
	setValue: (next: unknown) => void;
	error: string | undefined;
})}
	<AmenitiesField {value} {setValue} invalid={error !== undefined} />
{/snippet}

{#snippet paymentMethodField({
	value,
	setValue
}: {
	value: unknown;
	setValue: (next: unknown) => void;
})}
	<PaymentMethodField {value} {setValue} />
{/snippet}

<!-- The "Your plan" cards (ASD §8). Picking the per-booking plan locks payment method to
     online in the same click — the model and the payment method are one fact. -->
{#snippet monetizationField({
	value,
	setValue
}: {
	value: unknown;
	setValue: (next: unknown) => void;
})}
	<MonetizationField
		{value}
		setValue={(next) => {
			setValue(next);
			if (next === 'booking_fee') values.paymentMethod = 'online';
		}}
	/>
{/snippet}

<!-- The form collects strings; the WIRE schema coerces them to the numbers the mutation
     stores, so the browser sends exactly what the server will re-parse — the same object,
     validated twice, defined once. `args` already has `photos` swapped from picked Files
     to uploaded R2 keys by the upload pipeline. -->
<ConvexMutationForm
	bind:values
	wizard
	sections={addAccommodationForm}
	schema={addAccommodationSchema as unknown as ZodType<typesAddAccommodationForm>}
	runFunction={api.tables.accommodations.mutations.createAccommodation.createApartment}
	mapArgs={(_formValues, args) => createAccommodationSchema.parse({ ...args, locale: 'en' })}
	onSuccess={goToMyAccommodations}
	submitLabel="Submit for review"
	customFields={{
		placeId: regionField,
		address: streetField,
		coordinates: mapField,
		amenities: amenitiesField,
		paymentMethod: paymentMethodField,
		monetization: monetizationField
	}}
/>
