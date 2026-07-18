// TYPES
import type { Doc, Id } from '@/convex/_generated/dataModel';

// ─── Raw `apartments` doc aliases ─────────────────────────────────────────────

export type typesAccommodation = Doc<'apartments'>;
export type typesAccommodationImage = Doc<'apartments'>['images'][number];
export type typesAccommodationStatus = Doc<'apartments'>['status'];

// ─── Search results ───────────────────────────────────────────────────────────

/**
 * Lean accommodation shape for the search results list + map markers (`id`/`lat`/`lng`/`title`
 * also satisfy GoogleMapMarkerData). Produced by the `fetchSearchAccommodations` query
 * from an `apartments` row.
 *
 * `rating`/`reviewCount` are optional because there is no reviews system yet — the card
 * renders "New" when they're absent. `isSuperhost` stays `false` until a host-reputation
 * concept exists.
 */
export type SearchAccommodation = Pick<
	Doc<'apartments'>,
	'slug' | 'title' | 'type' | 'city' | 'bedrooms' | 'bathrooms' | 'maxGuests'
> & {
	id: Id<'apartments'>;
	country: string; // required here; optional on the row
	lat: number; // flattened from `coordinates`
	lng: number;
	pricePerNight: number; // effective nightly — what the card and map tag show
	originalPrice?: number; // struck through when a discount applies
	rating?: number;
	reviewCount?: number;
	isSuperhost: boolean;
	image: Doc<'apartments'>['images'][number]; // cover
};

// ─── Single-accommodation shapes ──────────────────────────────────────────────
// `typesAccommodationSafe` is the curated public projection of an `apartments` row (no
// owner/internal fields). `typesAccommodationEnriched` adds the joins the detail/book queries
// resolve: a `host` profile (`hostId` → better-auth user) and `bookedRanges` (from the bookings
// table) the availability calendar greys out.

export type typesAccommodationHost = {
	id: string;
	name: string;
	avatarUrl?: string;
	joinedAt: number; // timestamp
	isSuperhost: boolean;
};

/** ISO date range (check-in inclusive, check-out exclusive) already reserved. */
export type typesBookedRange = { start: string; end: string };

/**
 * Curated public projection of an `apartments` row — the safe subset the detail/book queries
 * return. Derived from `Doc<'apartments'>` by omitting the owner/internal fields (ownership, status,
 * payment/admin, search keys, timestamps), so a new schema column surfaces here automatically —
 * add it to the omit list below if it shouldn't be public.
 */
export type typesAccommodationSafe = Omit<
	Doc<'apartments'>,
	| '_creationTime'
	| 'hostId'
	| 'isSuperhost'
	| 'addressNumber'
	| 'placeId'
	| 'status'
	| 'isFeatured'
	| 'paidAt'
	| 'paymentAmount'
	| 'paymentOrderId'
	| 'apartmentSubscriptionExpiryDate'
	| 'updatedAt'
	| 'paymentMethod'
> & {
	/** Required here even though the column is optional — the queries default a missing value to `cash`.
	 *  `both` means the guest chooses cash or online at checkout. */
	paymentMethod: NonNullable<Doc<'apartments'>['paymentMethod']>;
};

/** The safe projection plus the joins the detail/book queries resolve: a host profile and the
 *  reserved date ranges the availability calendar greys out. */
export type typesAccommodationEnriched = typesAccommodationSafe & {
	host: typesAccommodationHost;
	bookedRanges: typesBookedRange[];
};

/**
 * The internal fields the public projection hides — returned to admins viewing an
 * **unpublished** accommodation so the public page can show everything. Absent once
 * the accommodation is published (admins then see the page exactly like guests).
 */
export type typesAccommodationAdminMeta = Pick<
	Doc<'apartments'>,
	| 'status'
	| 'hostId'
	| 'addressNumber'
	| 'placeId'
	| 'isFeatured'
	| 'moderatedAt'
	| 'moderatedBy'
	| 'moderationReason'
	| 'paidAt'
	| 'paymentAmount'
	| 'apartmentSubscriptionExpiryDate'
	| 'updatedAt'
> & { createdAt: number };

/** What `fetchAccommodationBySlugSafe` actually returns: the public shape, plus
 *  `adminMeta` when (and only when) an admin is viewing an unpublished accommodation. */
export type typesAccommodationForViewer = typesAccommodationEnriched & {
	adminMeta?: typesAccommodationAdminMeta;
};

// ─── Add / edit accommodation forms ───────────────────────────────────────────

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

	/** City + country place ids of the picked place, space-joined — the accommodation's search key and
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
	paymentMethod: NonNullable<Doc<'apartments'>['paymentMethod']>;
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
 * Edit form values: the add-form shape plus the accommodation `id` and the photo
 * reconciliation field `keepImageKeys` (existing image keys still kept, in display
 * order). Here `photos` holds only the *newly* added files. `id` / `keepImageKeys`
 * aren't part of the Zod schema (it ignores unknown keys) but are forwarded
 * straight through to the `updateApartment` mutation.
 */
export type typesEditAccommodationForm = typesAddAccommodationForm & {
	id: string;
	keepImageKeys: string[];
};

/**
 * Admin add-form values: the add-form shape plus the mandatory `hostId` — the
 * better-auth user id of the owner the admin assigns the accommodation to.
 */
export type typesAdminAddAccommodationForm = typesAddAccommodationForm & {
	hostId: string;
};
