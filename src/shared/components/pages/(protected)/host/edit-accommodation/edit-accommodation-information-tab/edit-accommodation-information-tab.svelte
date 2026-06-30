<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import ConvexMutationForm from '@/shared/components/ui/mutation-form/convex-mutation-form.svelte';
	import PlacesAutocomplete from '@/shared/components/ui/places-autocomplete/places-autocomplete.svelte';
	import LocationMap from '@/shared/components/ui/location-map/location-map.svelte';
	import AmenitiesField from '@/shared/components/pages/(protected)/host/add-accommodation/amenities-field.svelte';
	import PaymentMethodField from '@/shared/components/pages/(protected)/host/add-accommodation/payment-method-field.svelte';
	import EditAccommodationExistingPhotos from './edit-accommodation-existing-photos.svelte';

	// SCHEMAS
	import { editAccommodationSchema } from '@/features/accommodations/schemas/editAccommodationSchema';

	// FORMS
	import { editAccommodationForm } from '@/features/accommodations/forms/editAccommodationForm';

	// UTILS
	import { accommodationDocToFormValues } from '@/features/accommodations/utils/accommodationDocToFormValues';
	import {
		applyRegionToValues,
		applyStreetToValues
	} from '@/features/accommodations/utils/applyPlaceToLocationValues';

	// LIBRARIES
	import { formatRegionLabel } from '@/shared/lib/google-maps/places';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';
	import type { typesEditAccommodationForm } from '@/shared/features/accommodation/types/accommodationTypes';
	import type { RegionBounds } from '@/shared/lib/google-maps/places';
	import type { ZodType } from 'zod';

	let { accommodation }: { accommodation: Doc<'apartments'> } = $props();

	// Seeded once from the loaded doc. The parent keys this component on
	// `accommodation.updatedAt`, so a successful save remounts it with fresh values
	// (clearing the consumed `photos` files and showing the new image set).
	// svelte-ignore state_referenced_locally
	let values = $state<typesEditAccommodationForm>(accommodationDocToFormValues(accommodation));

	// Viewport of the picked country/city — scopes the street search to that region. Empty until
	// the host re-picks a region (the stored listing carries city/country but no viewport), so the
	// street search falls back to a country-wide bias until then.
	let regionViewport = $state<RegionBounds | undefined>();
	const regionSelected = $derived(Boolean(values.city || values.country));

	// Seed the city input's display with the stored "City, Country" so the field isn't blank on
	// edit. The id stays valid from the doc until the host edits the text (which clears it).
	// svelte-ignore state_referenced_locally
	const cityInitial = formatRegionLabel({
		city: values.city,
		country: values.country,
		formattedAddress: ''
	});
</script>

<!-- City autocomplete — cities only (country shown as secondary text). On select it fills
     city/country, resolves `placeId` (the merged city+country key and gate), and captures the
     region viewport. Editing the text clears the id, so a real pick is required. -->
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
			void applyRegionToValues(values, place, setValue, (vp) => (regionViewport = vp ?? undefined));
		}}
	/>
{/snippet}

<!-- Street autocomplete — disabled until a country/city is set, then restricted to that region's
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
	submitLabel="Save changes"
	resetOnSuccess={false}
	customFields={{
		placeId: regionField,
		address: streetField,
		coordinates: mapField,
		amenities: amenitiesField,
		paymentMethod: paymentMethodField,
		keepImageKeys: existingPhotosField
	}}
/>
