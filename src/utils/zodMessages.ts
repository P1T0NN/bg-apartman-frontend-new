// LIBRARIES
import { z } from 'zod';

// SCHEMAS
import { ACCOMMODATION_ISSUE } from '@/shared/features/accommodation/schemas/accommodationsSchemas';
import { BOOKING_ISSUE } from '@/shared/features/booking/schemas/bookingsSchemas';
import { AUTH_ISSUE } from '@/shared/features/auth/schemas/authSchemas';
import { ACCOMMODATIONS_CONFIG } from '@/shared/config';
import { MIN_ACCOMMODATION_AMENITIES } from '@/shared/features/accommodation/schemas/accommodationsSchemas';

/**
 * Human error copy for the SHARED zod schemas — installed on the client, and only on the client.
 *
 * ## The problem this solves
 * The schemas under `src/shared/features/<feature>/schemas/` are imported by BOTH browser and
 * Convex (mutation args are derived from the same schema that validates the form). That is the
 * whole point: one definition, no drift. But it means anything those schemas import gets bundled
 * into the backend too — so putting display strings in them would drag copy, and eventually an
 * i18n runtime, into functions that will never render a word to anybody.
 *
 * ## The solution
 * Zod already separates *what is invalid* from *how you say so*. A schema records the rule; an
 * **error map** turns a violation into a sentence. So the schemas stay message-free and portable,
 * and the sentences live here, in `src/utils/**` — a client-only layer Convex never imports,
 * next to `messages.ts`, which does the same job for backend message keys.
 *
 * Call {@link installZodMessages} once at app boot (the root layout). After that every
 * `safeParse` in the browser produces real copy, including parses inside `MutationForm`, with no
 * schema touched and nothing added to the server bundle.
 *
 * The backend keeps zod's built-in English defaults, which is correct: its messages are never
 * shown to a user. Convex returns message KEYS (`{ success, message: { key } }`) and the client
 * translates those — a schema-level parse failure there means a client bypassed validation, and
 * it collapses to `GenericMessages.UNEXPECTED_ERROR` by design.
 *
 * ## Adding translations later
 * This file is the single seam. Swap the string literals below for `m.some_key()` (paraglide,
 * wuchale, anything) and the whole app is translated — schemas, Convex, and every other feature
 * stay untouched, and the backend bundle still contains zero translation code.
 */

/**
 * Copy for cross-field rules, keyed by the KEY the schema's `.refine`/`.superRefine` passes.
 * Those violations can't be inferred from a zod issue code, so the schema names them and this
 * map speaks them.
 */
const BY_ISSUE_KEY: Record<string, string> = {
	[ACCOMMODATION_ISSUE.BEDROOMS_REQUIRED]: 'At least one bedroom (studios can have none).',
	[ACCOMMODATION_ISSUE.PHOTOS_MIN_TOTAL]: `Keep or add at least ${ACCOMMODATIONS_CONFIG.MIN_IMAGES} photos in total.`,
	[ACCOMMODATION_ISSUE.MONETIZATION_REQUIRED]:
		'Pick a plan for this listing — listing fee or per-booking fee.',
	// Marks a field invalid for styling without printing a second sentence.
	[ACCOMMODATION_ISSUE.SILENT]: '',
	[BOOKING_ISSUE.MIN_ONE_NIGHT]: 'Your stay must be at least one night.',
	[AUTH_ISSUE.PASSWORD_TOO_COMMON]: 'That password is too common. Please choose a stronger one.'
};

/**
 * Field-specific copy, keyed by the schema path zod reports (`guestEmail`, `photos`).
 * Only for fields where the generic sentence would be vague or wrong — everything else falls
 * through to {@link genericMessage}, which is why this map stays short.
 */
const BY_PATH: Record<string, string> = {
	// Accommodation
	placeId: 'Select your city from the list (typing alone won’t set it).',
	type: 'Choose a property type.',
	description: 'Add a short description (at least 20 characters).',
	amenities: `Select at least ${MIN_ACCOMMODATION_AMENITIES} amenities.`,
	photos: `Please upload at least ${ACCOMMODATIONS_CONFIG.MIN_IMAGES} photos.`,
	pricePerNight: 'Set a nightly price.',
	squareMeters: 'Enter the size in m².',
	maxGuests: 'At least one guest.',
	bathrooms: 'At least one bathroom.',
	minReservationDays: 'Minimum 1 night.',
	checkInTime: 'Set a check-in time.',
	checkOutTime: 'Set a check-out time.',
	hostId: 'Pick the owner of this accommodation.',

	// Booking — form names and their `guest*` wire twins share the copy.
	phone: 'Enter a valid phone number.',
	guestPhone: 'Enter a valid phone number.',
	checkIn: 'Select your dates.',
	checkOut: 'Select your dates.',
	checkInDate: 'Select your dates.',
	checkOutDate: 'Select your dates.',
	bookingCode: 'Enter the booking code from your confirmation email.',

	// Moderation / support reasons — all share the same 4-character floor.
	declineReason: 'Please write at least 4 characters.',
	cancelReason: 'Reason must be at least 4 characters.',
	reason: 'Reason must be at least 4 characters.',

	// Auth
	confirmPassword: 'Confirm your password.',
	code: 'Use the 8-digit code from your email.'
};

/** Generic copy by violation, used when a path has no bespoke sentence. */
function genericMessage(issue: {
	code?: string;
	expected?: string;
	minimum?: unknown;
	maximum?: unknown;
	format?: string;
}): string {
	switch (issue.code) {
		case 'invalid_type':
			// Zod reports a missing required field as an `undefined` input, not a separate code.
			return issue.expected === 'string' || issue.expected === 'number'
				? 'This field is required.'
				: 'Check this field.';
		case 'too_small':
			return issue.minimum === 1 || issue.minimum === 0
				? 'This field is required.'
				: `Must be at least ${String(issue.minimum)} characters.`;
		case 'too_big':
			return `Keep this under ${String(issue.maximum)} characters.`;
		case 'invalid_format':
			return issue.format === 'email' ? 'Enter a valid email.' : 'The format is not valid.';
		case 'invalid_value':
		case 'invalid_union':
			return 'Select a valid option.';
		default:
			return 'Check this field.';
	}
}

/**
 * Install the global error map. Idempotent, so a hot reload or a second call is harmless.
 *
 * Resolution order: the KEY a refinement passed in `params` → bespoke copy for the field
 * path → a generic sentence for the violation.
 *
 * Refinement keys travel as `params: { key }`, NOT as `message`. Zod skips this map entirely
 * for any issue that already carries an explicit `message`, so a schema using `message` for
 * its key would leak the raw key straight into the UI.
 */
export function installZodMessages(): void {
	z.config({
		customError: (issue) => {
			const key = (issue as { params?: { key?: string } }).params?.key;
			if (key !== undefined) {
				const byKey = BY_ISSUE_KEY[key];
				if (byKey !== undefined) return byKey;
			}

			// Try the full dotted path first, then the leaf, so `delivery.address.city` can
			// have bespoke copy while a bare `city` elsewhere still falls back to it.
			const path = issue.path?.join('.') ?? '';
			const bespoke = BY_PATH[path] ?? BY_PATH[String(issue.path?.at(-1) ?? '')];
			if (bespoke) return bespoke;

			return genericMessage(
				issue as {
					code?: string;
					expected?: string;
					minimum?: unknown;
					maximum?: unknown;
					format?: string;
				}
			);
		}
	});
}
