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
	import AddAccommodationHeader from '@/shared/components/pages/(protected)/add-accommodation/add-accommodation-header.svelte';

	// SCHEMAS
	import { addAccommodationSchema } from '@/features/accommodations/schemas/addAccommodationSchema';

	// FORMS
	import { addAccommodationForm } from '@/features/accommodations/forms/addAccommodationForm';

	// TYPES
	import type { typesAddAccommodationForm } from '@/features/accommodations/types/typesAddAccommodationForm';
	import type { ZodType } from 'zod';

	const addAccommodationInitialValues: typesAddAccommodationForm = {
		title: '',
		type: '',
		description: '',

		cityPlaceId: '',
		address: '',
		city: '',
		country: '',
		coordinates: undefined,

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
		checkOutTime: '10:00',
		quietHoursStart: '',
		quietHoursEnd: '',

		instantBooking: false,
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
</script>

<SvelteHead
	title={m['AddAccommodationPage.SEO.title']()}
	description={m['AddAccommodationPage.SEO.description']()}
/>

<!-- Google Places (New) autocomplete — the single address entry. On select it fills
     cityPlaceId (the required field) plus address/city/country/coordinates. -->
{#snippet placesField({
	inputId,
	setValue
}: {
	inputId: string;
	setValue: (next: unknown) => void;
})}
	<PlacesAutocomplete
		id={inputId}
		regionCodes={['rs']}
		onSelect={(place) => {
			// Via the form's setValue so the field's validation error clears on select.
			setValue(place.placeId);
			values.address = place.addressLine;
			values.city = place.city;
			values.country = place.country;
			values.coordinates =
				place.lat !== null && place.lng !== null ? { lat: place.lat, lng: place.lng } : undefined;
		}}
	/>
{/snippet}

<!-- Read-only map showing the pin from the selected address's coordinates. -->
{#snippet mapField({ value }: { value: unknown })}
	{@const coords = value as { lat: number; lng: number } | undefined}
	<LocationMap lat={coords?.lat} lng={coords?.lng} />
{/snippet}

{#snippet amenitiesField({
	value,
	setValue
}: {
	value: unknown;
	setValue: (next: unknown) => void;
})}
	<AmenitiesField {value} {setValue} />
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
		customFields={{ cityPlaceId: placesField, coordinates: mapField, amenities: amenitiesField }}
	/>
</Section>
