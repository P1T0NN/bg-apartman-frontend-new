<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import Section from '@/shared/components/ui/section/section.svelte';
	import ConvexMutationForm from '@/shared/components/ui/mutation-form/convex-mutation-form.svelte';
	import PlacesAutocomplete from '@/shared/components/ui/places-autocomplete/places-autocomplete.svelte';
	import LocationMap from '@/shared/components/ui/location-map/location-map.svelte';
	import AmenitiesField from '@/shared/components/pages/(protected)/add-accommodation/amenities-field.svelte';
	import PaymentMethodField from '@/shared/components/pages/(protected)/add-accommodation/payment-method-field.svelte';
	import AddAccommodationHeader from '@/shared/components/pages/(protected)/add-accommodation/add-accommodation-header.svelte';

	// SCHEMAS
	import { addAccommodationSchema } from '@/features/accommodations/schemas/addAccommodationSchema';

	// FORMS
	import { addAccommodationForm } from '@/features/accommodations/forms/addAccommodationForm';

	// UTILS
	import {
		applyRegionToValues,
		applyStreetToValues
	} from '@/features/accommodations/utils/applyPlaceToLocationValues';

	// TYPES
	import type { typesAddAccommodationForm } from '@/features/accommodations/types/types';
	import type { RegionBounds } from '@/shared/lib/google-maps/places';
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
		monthlyDiscount: '',

		minReservationDays: '1',
		maxReservationDays: '',
		checkInTime: '15:00',
		checkOutTime: '12:00',
		quietHoursStart: '',
		quietHoursEnd: '',

		instantBooking: false,
		paymentMethod: 'cash',
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
</script>

<SvelteHead
	title={m['AddAccommodationPage.SEO.title']()}
	description={m['AddAccommodationPage.SEO.description']()}
/>

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

<Section yPadding="lg" containerClass="mx-auto max-w-3xl">
	<AddAccommodationHeader />

	<ConvexMutationForm
		bind:values
		wizard
		sections={addAccommodationForm}
		schema={addAccommodationSchema as unknown as ZodType<typesAddAccommodationForm>}
		runFunction={api.tables.accommodations.mutations.createAccommodation.createApartment}
		submitLabel={m['AddAccommodationPage.ConvexMutationForm.submitLabel']()}
		customFields={{
			placeId: regionField,
			address: streetField,
			coordinates: mapField,
			amenities: amenitiesField,
			paymentMethod: paymentMethodField
		}}
	/>
</Section>
