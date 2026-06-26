// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { PaymentMethod } from '@/features/bookings/data/paymentMethods';

export type typesAccommodation = Doc<'apartments'>;
export type typesAccommodationImage = Doc<'apartments'>['images'][number];
export type typesAccommodationStatus = Doc<'apartments'>['status'];

/**
 * Form value shape. Text / numeric / time fields are all `string` because that's
 * what `<input>` produces (numbers are coerced on the backend). Checkboxes are
 * booleans, amenities a string array, coordinates an optional lat/lng object
 * (populated by Google Places).
 */
export type typesAddAccommodationForm = {
	title: string;
	type: string;
	description: string;

	/** City + country place ids of the picked place, space-joined — the listing's search key and
	 *  the "address selected" gate (empty until a place is chosen). */
	placeId: string;
	/** Street name from the picked place (the route) — where the map pin sits. */
	address: string;
	/** House/street number, entered manually by the host. */
	addressNumber: string;
	city: string;
	country: string;
	coordinates?: { lat: number; lng: number };
	/** IANA zone resolved from the pin; empty until an address is selected. */
	timeZone?: string;

	bedrooms: string;
	bathrooms: string;
	maxGuests: string;
	squareMeters: string;

	pricePerNight: string;
	cleaningFee: string;
	weekendPremium: string;
	discountAmount: string;
	weeklyDiscount: string;
	monthlyDiscount: string;

	minReservationDays: string;
	maxReservationDays: string;
	checkInTime: string;
	checkOutTime: string;
	quietHoursStart: string;
	quietHoursEnd: string;

	instantBooking: boolean;
	paymentMethod: PaymentMethod;
	sameDayReservation: boolean;
	singleDayReservation: boolean;
	petsAllowed: boolean;
	smokingAllowed: boolean;
	partiesAllowed: boolean;

	amenities: string[];
	houseRules: string;

	/** Selected photo files; uploaded to R2 on submit and stored as `images`. */
	photos: File[];
};

/**
 * Edit form values: the add-form shape plus the listing `id` and the photo
 * reconciliation field `keepImageKeys` (existing image keys still kept, in display
 * order). Here `photos` holds only the *newly* added files. `id` / `keepImageKeys`
 * aren't part of the Zod schema (it ignores unknown keys) but are forwarded
 * straight through to the `updateApartment` mutation.
 */
export type typesEditAccommodationForm = typesAddAccommodationForm & {
	id: string;
	keepImageKeys: string[];
};
