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

	cityPlaceId: string;
	address: string;
	city: string;
	country: string;
	coordinates?: { lat: number; lng: number };

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
