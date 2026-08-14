<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import ConvexMutationForm from '@/components/ui/mutation-form/convex-mutation-form.svelte';
	import PlacesAutocomplete from '@/components/ui/places-autocomplete/places-autocomplete.svelte';
	import LocationMap from '@/components/ui/location-map/location-map.svelte';
	import SearchInputConvex from '@/components/ui/search-input/search-input-convex.svelte';
	import AdminAmenitiesField from '@/components/pages/(protected)/admin/add-accommodation/admin-amenities-field.svelte';
	import AdminPaymentMethodField from '@/components/pages/(protected)/admin/add-accommodation/admin-payment-method-field.svelte';
	import AdminMonetizationField from '@/components/pages/(protected)/admin/add-accommodation/admin-monetization-field.svelte';

	// UTILS
	import { appGoto } from '@/utils/app-navigation';
	import {
		applyRegionToValues,
		applyStreetToValues
	} from '@/features/accommodations/utils/applyPlaceToLocationValues';

	// SCHEMAS
	import {
		adminAddAccommodationSchema,
		createAccommodationAdminSchema
	} from '@/shared/features/accommodation/schemas/accommodationsSchemas';

	// FORMS
	import { adminAddAccommodationForm } from '@/features/accommodations/forms/addAccommodationForm';

	// TYPES
	import type { typesAdminAddAccommodationForm } from '@/shared/features/accommodation/types/accommodationTypes';
	import type { ZodType } from 'zod';

	const addAccommodationInitialValues: typesAdminAddAccommodationForm = {
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

		photos: [],
		// The picked owner's better-auth user id — empty until a dropdown selection.
		hostId: ''
	};

	let values = $state<typesAdminAddAccommodationForm>(
		structuredClone(addAccommodationInitialValues)
	);

	// Stable per-accommodation R2 folder for this form's uploads. Photos upload BEFORE the
	// apartment row exists, so the folder can't be the Convex `_id` — a client-generated id
	// is minted once and reused on retry; success redirects/unmounts → next create is fresh.
	const uploadFolder = crypto.randomUUID();

	// Owner picker state. The SearchInput shows the typed text; `hostId` holds the picked
	// user's id. Any edit that diverges from the last selected title invalidates the pick, so
	// typing a name alone never creates the listing on an unconfirmed owner.
	let ownerText = $state('');
	let selectedOwnerTitle = $state('');

	$effect(() => {
		if (ownerText !== selectedOwnerTitle) {
			values.hostId = '';
		}
	});

	const regionSelected = $derived(Boolean(values.city || values.country));

	const goToAdminAccommodations = () => appGoto(ADMIN_PAGE_ENDPOINTS.ACCOMMODATIONS);
</script>

<!-- City autocomplete — cities only (country shown as secondary text). On select it fills
     city/country, resolves `placeId` (the merged city+country search key and required gate) and
     sets the name the street search appends to its query. Editing the text clears the id, so the
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
		placeholder={m['AdminAddAccommodationPage.AdminAddAccommodationForm.searchCityPlaceholder']()}
		onInput={() => setValue('')}
		onSelect={(place) => {
			void applyRegionToValues(values, place, setValue);
		}}
	/>
{/snippet}

<!-- Street autocomplete — disabled until a city is picked; the picked city is appended to the
     query to scope the search (a viewport restriction suppresses resort-town streets). On select
     it fills the street name, map pin and timezone. -->
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
		placeholder={regionSelected
			? m['AdminAddAccommodationPage.AdminAddAccommodationForm.searchStreetPlaceholder']()
			: m['AdminAddAccommodationPage.AdminAddAccommodationForm.pickCityFirst']()}
		bind:value={values.address}
		onSelect={(place) => applyStreetToValues(values, place, setValue)}
	/>
{/snippet}

<!-- Read-only map showing the pin from the selected address's coordinates. -->
{#snippet mapField({ value }: { value: unknown })}
	{@const coords = value as { lat: number; lng: number } | undefined}
	<LocationMap lat={coords?.lat} lng={coords?.lng} />
{/snippet}

{#snippet ownerField({
	inputId,
	setValue,
	error
}: {
	inputId: string;
	setValue: (next: unknown) => void;
	error: string | undefined;
})}
	<!-- Typeahead against name AND email (2 letters minimum, 7 results). Selecting stores the
	     user's `_id` as `hostId` — the mandatory gate this step's schema enforces. -->
	<SearchInputConvex
		id={inputId}
		bind:value={ownerText}
		query={api.tables.users.userQueries.searchUsers}
		minQueryLength={2}
		maxResults={7}
		placeholder={m['AdminAddAccommodationPage.AdminAddAccommodationForm.searchOwnerPlaceholder']()}
		aria-invalid={error ? 'true' : undefined}
		onSelect={(item) => {
			selectedOwnerTitle = item.title;
			setValue(item.id);
		}}
	/>
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
	<AdminAmenitiesField {value} {setValue} invalid={error !== undefined} />
{/snippet}

{#snippet paymentMethodField({
	value,
	setValue
}: {
	value: unknown;
	setValue: (next: unknown) => void;
})}
	<AdminPaymentMethodField {value} {setValue} />
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
	<AdminMonetizationField
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
	sections={adminAddAccommodationForm}
	schema={adminAddAccommodationSchema as unknown as ZodType<typesAdminAddAccommodationForm>}
	runFunction={api.tables.accommodations.mutations.createAccommodation.createApartmentAdmin}
	mapArgs={(_formValues, args) => createAccommodationAdminSchema.parse({ ...args, locale: 'en' })}
	onSuccess={goToAdminAccommodations}
	submitLabel="Submit for review"
	{uploadFolder}
	customFields={{
		hostId: ownerField,
		placeId: regionField,
		address: streetField,
		coordinates: mapField,
		amenities: amenitiesField,
		paymentMethod: paymentMethodField,
		monetization: monetizationField
	}}
/>
