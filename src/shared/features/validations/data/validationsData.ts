// CONFIG
import { ACCOMMODATIONS_CONFIG, AUTH_DATA } from '@/shared/config';

// The `ValidationMessages.*` catalog keys the default zod error map emits.
// Texts live in `backendMessages.ts` under the same paths — add a key here, add its copy
// there, and `mapDefaultValidationErrors.ts` can start emitting it.

/** Generic copy by violation, used when nothing more specific applies. */
export const VALIDATION_MESSAGE_KEYS = {
	required: 'ValidationMessages.Default.required',
	invalidValue: 'ValidationMessages.Default.invalidValue',
	notANumber: 'ValidationMessages.Default.notANumber',
	invalidDate: 'ValidationMessages.Default.invalidDate',
	invalidEmail: 'ValidationMessages.Default.invalidEmail',
	invalidUrl: 'ValidationMessages.Default.invalidUrl',
	invalidChoice: 'ValidationMessages.Default.invalidChoice',
	textTooShort: 'ValidationMessages.Default.textTooShort',
	textTooLong: 'ValidationMessages.Default.textTooLong',
	tooFewItems: 'ValidationMessages.Default.tooFewItems',
	tooManyItems: 'ValidationMessages.Default.tooManyItems',
	numberNotNegative: 'ValidationMessages.Default.numberNotNegative',
	numberTooSmall: 'ValidationMessages.Default.numberTooSmall',
	numberTooBig: 'ValidationMessages.Default.numberTooBig'
} as const;

/**
 * Field-path → catalog key, for fields where the generic sentence would be vague or wrong.
 * Keyed by the path zod reports: the full dotted path is tried first, then the leaf, so
 * `delivery.address.city` can have bespoke copy while a bare `city` elsewhere falls back.
 *
 * Values are a bare key, or `JSON.stringify({ key, params })` when the copy interpolates —
 * the same wire form the rest of the feature speaks.
 *
 * Deliberately short — everything not listed gets a {@link VALIDATION_MESSAGE_KEYS} code.
 * This is data, not copy: the words live in `backendMessages.ts`.
 */
export const VALIDATION_FIELD_MESSAGE_KEYS: Record<string, string> = {
	// Accommodation
	placeId: 'ValidationMessages.Field.placeId',
	type: 'ValidationMessages.Field.type',
	description: 'ValidationMessages.Field.description',
	amenities: JSON.stringify({
		key: 'ValidationMessages.Field.amenities',
		params: { min: ACCOMMODATIONS_CONFIG.MIN_AMENITIES }
	}),
	photos: JSON.stringify({
		key: 'ValidationMessages.Field.photos',
		params: { min: ACCOMMODATIONS_CONFIG.MIN_IMAGES }
	}),
	pricePerNight: 'ValidationMessages.Field.pricePerNight',
	squareMeters: 'ValidationMessages.Field.squareMeters',
	maxGuests: 'ValidationMessages.Field.maxGuests',
	bathrooms: 'ValidationMessages.Field.bathrooms',
	minReservationDays: 'ValidationMessages.Field.minReservationDays',
	checkInTime: 'ValidationMessages.Field.checkInTime',
	checkOutTime: 'ValidationMessages.Field.checkOutTime',
	hostId: 'ValidationMessages.Field.hostId',

	// Booking — form names and their `guest*` wire twins share the copy.
	phone: 'ValidationMessages.Field.phone',
	guestPhone: 'ValidationMessages.Field.phone',
	checkIn: 'ValidationMessages.Field.stayDates',
	checkOut: 'ValidationMessages.Field.stayDates',
	checkInDate: 'ValidationMessages.Field.stayDates',
	checkOutDate: 'ValidationMessages.Field.stayDates',
	bookingCode: 'ValidationMessages.Field.bookingCode',

	// Moderation / support reasons — all share the same 4-character floor.
	declineReason: 'ValidationMessages.Field.reason',
	cancelReason: 'ValidationMessages.Field.reason',
	reason: 'ValidationMessages.Field.reason',

	// Auth
	confirmPassword: 'ValidationMessages.Field.confirmPassword',
	code: JSON.stringify({
		key: 'ValidationMessages.Field.code',
		params: { length: AUTH_DATA.OTP_LENGTH }
	})
};
