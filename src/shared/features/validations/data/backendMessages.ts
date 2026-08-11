/**
 * English strings the backend is allowed to name by key.
 *
 * Convex never returns display text — it returns `{ key, params? }` descriptors
 * (see `TranslatableMessage`), and this map is the one place those keys become words.
 * Keeping it here means Convex bundles no message catalog and no i18n runtime.
 *
 * Adding a backend message = add the key here and emit it from the mutation. If a locale
 * is ever added back, this object is the seam to swap for a translation lookup.
 */
export const BACKEND_MESSAGES: Record<string, string> = {
	'GenericMessages.ACCOMMODATION_CREATED': 'Accommodation submitted for review.',
	'GenericMessages.ACCOMMODATION_HAS_ACTIVE_BOOKINGS':
		"This accommodation has active bookings and can't be deleted. Cancel or decline them first.",
	'GenericMessages.ACCOMMODATION_NOT_AVAILABLE_TO_SAVE':
		'This accommodation is not available to save.',
	'GenericMessages.ACCOMMODATION_NOT_BOOKABLE':
		'This listing is no longer live, so bookings for it cannot be confirmed.',
	'GenericMessages.CALENDAR_UPDATED': 'Calendar updated.',
	'GenericMessages.DATES_HAVE_CONFIRMED_STAY':
		'Those dates have a confirmed stay. Cancel the booking first if you need them back.',
	'GenericMessages.ACCOMMODATION_STATUS_UPDATED': 'Accommodation visibility updated.',
	'GenericMessages.SUSPENDED_CANNOT_RESUBMIT':
		"A suspended listing is reviewed by our team — reply to the suspension email and we'll take it from there.",
	'GenericMessages.PHOTOS_MIN_REQUIRED':
		"Add at least {min} photos — guests rarely book what they can't see.",
	'GenericMessages.PHOTOS_MAX_EXCEEDED': 'A listing can have at most {max} photos.',
	'GenericMessages.ACCOMMODATION_UPDATED': 'Accommodation updated.',
	'GenericMessages.ACCOMMODATION_FEATURED': 'Accommodation added to the homepage strip.',
	'GenericMessages.ACCOMMODATION_UNFEATURED': 'Accommodation removed from the homepage strip.',
	'GenericMessages.LISTING_FEE_PAID': 'Listing renewed — it stays live for another period.',
	'GenericMessages.FREE_PUBLISH_GRANTED': 'Free publish granted — the listing is live with no payment recorded.',
	'GenericMessages.LISTING_FEE_UNPAID':
		"This listing's fee hasn't been paid yet, so it can't go live. Record the payment first.",
	'GenericMessages.MONETIZATION_CHOICE_REQUIRED':
		'Pick a plan for this listing — listing fee or per-booking fee.',
	'GenericMessages.BOOKING_FEE_REQUIRES_ONLINE':
		'Per-booking fee listings accept online payments only.',
	'GenericMessages.MONETIZATION_SWITCH_FORBIDDEN':
		'A per-booking fee listing cannot move to a listing fee — create a new listing instead.',
	'GenericMessages.MONETIZATION_SWITCHED':
		'Plan changed — this listing now runs on the per-booking fee.',
	'GenericMessages.LISTING_FEE_CHARGE_FAILED':
		"The payment didn't go through, so nothing was charged and the listing is unchanged. Please try again.",
	'GenericMessages.RENEWAL_NEEDS_SUPPORT':
		"Online renewal isn't available yet — reply to your renewal email or contact us and we'll take care of it.",
	'GenericMessages.ADMIN_ACCESS_REQUIRED': 'This action requires admin privileges.',
	'GenericMessages.ADMIN_CANNOT_BE_DELETED': 'Admins can\'t be deleted. Demote to "user" first.',
	'GenericMessages.ALL_SESSIONS_REVOKED': 'All sessions revoked.',
	'GenericMessages.BATCH_TOO_LARGE': 'Too many items in a single request (max {limit}).',
	'GenericMessages.HOST_CANCEL_WINDOW_CLOSED':
		"This paid booking can't be cancelled this close to check-in. Contact support for emergencies.",
	'GenericMessages.BOOKING_CANCEL_TOO_LATE':
		'The cancellation window for this booking has closed. Contact the host if your plans changed.',
	'GenericMessages.BOOKING_ALREADY_REQUESTED':
		"You've already requested these dates — here's that reservation.",
	'GenericMessages.BOOKING_CREATED': 'Booking confirmed.',
	'GenericMessages.BOOKING_UPDATED': 'Booking updated.',
	'GenericMessages.DATA_TABLE_DELETED_ALL': 'Deleted {count} item(s).',
	'GenericMessages.DATA_TABLE_DELETED_WITH_MISSING':
		'Deleted {count} item(s); {missing} were already gone.',
	'GenericMessages.DATES_UNAVAILABLE':
		'Those dates were just booked by someone else. Please pick different dates.',
	'GenericMessages.EMAIL_SENT_SUCCESSFULLY': 'Email sent successfully.',
	'GenericMessages.FAVORITES_MERGED': 'Saved stays synced to your account.',
	'GenericMessages.FAVORITE_REMOVED': 'Removed from your list.',
	'GenericMessages.FAVORITE_SAVED': 'Saved to your list.',
	'GenericMessages.FORBIDDEN': "You're not allowed to perform this action.",
	'GenericMessages.INVALID_BOOKING_DATES': 'Check-out must be after check-in.',
	'GenericMessages.MODERATION_REASON_REQUIRED': 'A reason is required to suspend a accommodation.',
	'GenericMessages.NEWSLETTER_SUBSCRIBED':
		'Thanks for subscribing! Check your inbox for the best stays and deals.',
	'GenericMessages.NOT_AUTHENTICATED': 'Please sign in to continue.',
	'GenericMessages.NO_ITEMS_PROVIDED': 'No items provided.',
	'GenericMessages.NO_MATCHING_ITEMS': 'No matching items found.',
	'GenericMessages.PASSWORD_TOO_COMMON':
		'That password is too common. Please choose a stronger one.',
	'GenericMessages.PASSWORD_TOO_LONG': 'Password is too long.',
	'GenericMessages.PASSWORD_TOO_SHORT': 'Password must be at least {min} characters.',
	'GenericMessages.PAYMENT_METHOD_NOT_ACCEPTED':
		"This accommodation doesn't accept that payment method.",
	'GenericMessages.CHECKOUT_READY': 'Taking you to secure checkout…',
	'GenericMessages.CHECKOUT_EXPIRED':
		'This checkout has expired. Start the booking again and your dates will be re-checked.',
	'GenericMessages.CHECKOUT_UNAVAILABLE':
		"We couldn't open the payment page. Nothing was charged — please try again.",
	'GenericMessages.PAYMENT_NOT_READY':
		"This booking's payment isn't ready yet. Refresh in a moment and try again.",
	'GenericMessages.PAYMENT_CAPTURE_FAILED':
		"The guest's payment could not be taken, so the booking wasn't confirmed. Ask them to book again.",
	'GenericMessages.ONLINE_PAYMENTS_UNAVAILABLE':
		'Online payments are not available yet — listings can only accept cash at check-in for now.',
	'GenericMessages.PAYOUTS_UNAVAILABLE':
		"We couldn't open payout setup right now. Your earnings are safe — please try again shortly.",
	'GenericMessages.PAYOUT_ONBOARDING_READY': 'Opening payout setup…',
	'GenericMessages.PAYMENT_FLAG_CLEARED': 'Payment flag cleared.',
	'GenericMessages.REPORT_MESSAGE_REQUIRED': 'Please add a few words about what happened.',
	'GenericMessages.REPORT_SUBMITTED': "Thanks for the report — we've received it.",
	'GenericMessages.REPORT_RESOLVED': 'Report resolved.',
	'GenericMessages.REPORT_REOPENED': 'Report reopened.',
	'GenericMessages.RESERVATION_FOUND': 'Found it — opening your reservation.',
	// Deliberately generic: never confirms whether a booking code exists.
	'GenericMessages.RESERVATION_NOT_FOUND':
		"We couldn't find a reservation with that code and email. Check both and try again.",
	'GenericMessages.SESSION_REVOKED': 'Session revoked.',
	'GenericMessages.STAY_CONFIRMATION_REQUESTED':
		"Confirmation request sent — the guest got an email with a one-click confirm. If they don't reply within 24 hours, cancelling unlocks.",
	'GenericMessages.STAY_CONFIRMATION_COOLDOWN':
		'You already asked recently — give the guest a bit more time to reply.',
	'GenericMessages.STAY_CONFIRMED':
		"Thanks — your stay is confirmed. Your host has been told you're coming.",
	'GenericMessages.HOST_CANCEL_NEEDS_CONFIRMATION':
		"Ask the guest to confirm their stay first — cancelling unlocks if they don't reply within 24 hours.",
	'GenericMessages.STORAGE_DELETE_FAILED':
		"Couldn't delete the file from storage. Nothing was removed.",
	'GenericMessages.STORAGE_URL_UNAVAILABLE': "Couldn't resolve the file URL.",
	'GenericMessages.TEST_ROW_CREATED': 'Test row created.',
	'GenericMessages.TOO_MANY_REQUESTS': 'Too many requests. Please try again later.',
	'GenericMessages.TOO_MANY_REQUESTS_MINUTES': 'Too many requests. Try again in {minutes} min.',
	'GenericMessages.TOO_MANY_REQUESTS_SECONDS': 'Too many requests. Try again in {seconds}s.',
	'GenericMessages.UNEXPECTED_ERROR': 'An unexpected error occurred. Please try again.',
	'GenericMessages.UPLOAD_NOT_FOUND': 'Upload not found. Please try again.',
	'GenericMessages.UPLOAD_SAVED': 'File saved.',
	'GenericMessages.UPLOAD_SAVE_FAILED': 'Could not save the uploaded file. Please try again.',
	'GenericMessages.UPLOAD_TOO_LARGE': 'File is too large.',
	'GenericMessages.UPLOAD_TYPE_NOT_ALLOWED': 'That file type is not allowed.',
	'GenericMessages.UPLOAD_URL_READY': 'Upload URL generated.',
	'GenericMessages.USER_BANNED': 'User banned.',
	'GenericMessages.USER_DELETED': 'User deleted.',
	'GenericMessages.USER_NOT_FOUND': 'User not found.',
	'GenericMessages.USER_ROLE_UPDATED': 'User role updated.',
	'GenericMessages.USER_SUPERHOST_UPDATED': 'Superhost status updated.',
	'GenericMessages.USER_UNBANNED': 'User unbanned.',
	'GenericMessages.YOU_NEED_TO_CORRECT_FORM_ERRORS': 'You need to correct form errors',

	// ── Default zod violations (emitted by `mapDefaultValidationErrors`) ────────
	'ValidationMessages.Default.required': 'This field is required.',
	'ValidationMessages.Default.invalidValue': 'Check this field.',
	'ValidationMessages.Default.notANumber': 'Enter a number.',
	'ValidationMessages.Default.invalidDate': 'Enter a valid date.',
	'ValidationMessages.Default.invalidEmail': 'Enter a valid email.',
	'ValidationMessages.Default.invalidUrl': 'Enter a valid link.',
	'ValidationMessages.Default.invalidChoice': 'Select a valid option.',
	'ValidationMessages.Default.textTooShort': 'Must be at least {min} characters.',
	'ValidationMessages.Default.textTooLong': 'Keep this under {max} characters.',
	'ValidationMessages.Default.tooFewItems': 'Add at least {min}.',
	'ValidationMessages.Default.tooManyItems': 'Add at most {max}.',
	'ValidationMessages.Default.numberNotNegative': "This can't be negative.",
	'ValidationMessages.Default.numberTooSmall': 'Enter {min} or more.',
	'ValidationMessages.Default.numberTooBig': 'Enter {max} or less.',

	// ── Field-specific copy (`VALIDATION_FIELD_MESSAGE_KEYS`) ──────────────────
	'ValidationMessages.Field.placeId': 'Select your city from the list (typing alone won’t set it).',
	'ValidationMessages.Field.type': 'Choose a property type.',
	'ValidationMessages.Field.description': 'Add a short description (at least 20 characters).',
	'ValidationMessages.Field.amenities': 'Select at least {min} amenities.',
	'ValidationMessages.Field.photos': 'Please upload at least {min} photos.',
	'ValidationMessages.Field.pricePerNight': 'Set a nightly price.',
	'ValidationMessages.Field.squareMeters': 'Enter the size in m².',
	'ValidationMessages.Field.maxGuests': 'At least one guest.',
	'ValidationMessages.Field.bathrooms': 'At least one bathroom.',
	'ValidationMessages.Field.minReservationDays': 'Minimum 1 night.',
	'ValidationMessages.Field.checkInTime': 'Set a check-in time.',
	'ValidationMessages.Field.checkOutTime': 'Set a check-out time.',
	'ValidationMessages.Field.hostId': 'Pick the owner of this accommodation.',
	'ValidationMessages.Field.phone': 'Enter a valid phone number.',
	'ValidationMessages.Field.stayDates': 'Select your dates.',
	'ValidationMessages.Field.bookingCode': 'Enter the booking code from your confirmation email.',
	'ValidationMessages.Field.reason': 'Please write at least 4 characters.',
	'ValidationMessages.Field.confirmPassword': 'Confirm your password.',
	'ValidationMessages.Field.code': 'Use the {length}-digit code from your email.',

	// ── Bespoke schema rules the default map can't express (`*_ISSUE` keys) ────
	'ValidationMessages.Accommodation.bedroomsRequired':
		'At least one bedroom (studios can have none).',
	'ValidationMessages.Accommodation.photosMinTotal': 'Keep or add at least {min} photos in total.',
	'ValidationMessages.Accommodation.monetizationRequired':
		'Pick a plan for this listing — listing fee or per-booking fee.',
	/** Marks a field invalid for styling without printing a second sentence. */
	'ValidationMessages.Accommodation.silent': '',
	'ValidationMessages.Booking.minOneNight': 'Your stay must be at least one night.',
	'ValidationMessages.Booking.maxStayNights': 'A single stay can be at most {max} nights.',
	'ValidationMessages.Auth.codeFormat': 'Use the {length}-digit code from your email.',
	'ValidationMessages.Auth.passwordTooCommon':
		'That password is too common. Please choose a stronger one.',
	'ValidationMessages.Auth.passwordsMustMatch': 'Passwords must match.'
};

/** Fill `{param}` placeholders. Unknown placeholders are left as-is (visible in dev). */
export function formatMessage(
	template: string,
	params?: Record<string, string | number | boolean>
): string {
	if (!params) return template;
	return template.replace(/\{(\w+)\}/g, (match, name: string) =>
		name in params ? String(params[name]) : match
	);
}
