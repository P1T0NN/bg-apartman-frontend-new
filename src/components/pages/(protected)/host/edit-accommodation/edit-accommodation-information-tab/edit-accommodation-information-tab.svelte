<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import ConvexMutationForm from '@/components/ui/mutation-form/convex-mutation-form.svelte';
	import PlacesAutocomplete from '@/components/ui/places-autocomplete/places-autocomplete.svelte';
	import LocationMap from '@/components/ui/location-map/location-map.svelte';
	import AmenitiesField from '@/components/pages/(protected)/host/add-accommodation/amenities-field.svelte';
	import PaymentMethodField from '@/components/pages/(protected)/host/add-accommodation/payment-method-field.svelte';
	import EditAccommodationExistingPhotos from './edit-accommodation-existing-photos.svelte';

	// SCHEMAS
	import {
		editAccommodationSchema,
		updateAccommodationSchema
	} from '@/shared/features/accommodation/schemas/accommodationsSchemas';

	// FORMS
	import { editAccommodationForm } from '@/features/accommodations/forms/editAccommodationForm';

	// UTILS
	import { accommodationDocToFormValues } from '@/features/accommodations/utils/accommodationDocToFormValues';
	import {
		applyRegionToValues,
		applyStreetToValues
	} from '@/features/accommodations/utils/applyPlaceToLocationValues';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';
	import type { typesEditAccommodationForm } from '@/shared/features/accommodation/types/accommodationTypes';
	import type { ZodType } from 'zod';

	let { accommodation }: { accommodation: Doc<'apartments'> } = $props();

	// Seeded once from the loaded doc. The parent keys this component on
	// `accommodation.updatedAt`, so a successful save remounts it with fresh values
	// (clearing the consumed `photos` files and showing the new image set).
	// svelte-ignore state_referenced_locally
	let values = $state<typesEditAccommodationForm>(accommodationDocToFormValues(accommodation));

	// R2 folder for new uploads: the accommodation's existing image keys already live under
	// one folder prefix, so new photos join it. Fallback uuid covers an image-less apartment.
	// Parent keys this component on `updatedAt`, so a save remounts → derived fresh.
	// svelte-ignore state_referenced_locally
	const uploadFolder = accommodation.images[0]?.key.split('/')[0] ?? crypto.randomUUID();

	const regionSelected = $derived(Boolean(values.city || values.country));

	// Seed the city input's display with the stored city so the field isn't blank on edit (the
	// country shows in its own field). The id stays valid from the doc until the host edits the
	// text (which clears it).
	// svelte-ignore state_referenced_locally
	const cityInitial = values.city || values.country;
</script>

<!-- City autocomplete — cities only (country shown as secondary text). On select it fills
     city/country, resolves `placeId` (the merged city+country key and gate), and sets the name
     the street search appends to its query. Editing the text clears the id, so a real pick is
     required. -->
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
		value={cityInitial}
		onInput={() => setValue('')}
		onSelect={(place) => {
			void applyRegionToValues(values, place, setValue);
		}}
	/>
{/snippet}

<!-- Street autocomplete — disabled until a country/city is set; the picked city is appended to
     the query to scope the search (a viewport restriction suppresses resort-town streets). On
     select it fills the street name, map pin and timezone. -->
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
		regionName={values.city}
		placeholder={regionSelected ? 'Search street name' : 'Pick a city first'}
		bind:value={values.address}
		onSelect={(place) => applyStreetToValues(values, place, setValue)}
	/>
{/snippet}

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

{#snippet existingPhotosField({
	value,
	setValue,
	error
}: {
	value: unknown;
	setValue: (next: unknown) => void;
	error: string | undefined;
})}
	<EditAccommodationExistingPhotos
		images={accommodation.images}
		keepKeys={(value as string[]) ?? []}
		setValue={(next) => setValue(next)}
		invalid={error !== undefined}
	/>
{/snippet}

<ConvexMutationForm
	bind:values
	sections={editAccommodationForm}
	schema={editAccommodationSchema as unknown as ZodType<typesEditAccommodationForm>}
	runFunction={api.tables.accommodations.mutations.updateAccommodation.updateApartment}
	mapArgs={(_formValues, args) =>
		updateAccommodationSchema.parse({ ...args, id: accommodation._id, locale: 'en' })}
	submitLabel="Save changes"
	resetOnSuccess={false}
	{uploadFolder}
	customFields={{
		placeId: regionField,
		address: streetField,
		coordinates: mapField,
		amenities: amenitiesField,
		paymentMethod: paymentMethodField,
		keepImageKeys: existingPhotosField
	}}
/>
