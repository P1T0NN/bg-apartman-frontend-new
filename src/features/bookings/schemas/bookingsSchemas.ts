// LIBRARIES
import { z } from 'zod';

// UTILS
import { nightsBetween } from '@/shared/utils/dateUtils';

/**
 * Validates the booking guest-details form (raw string inputs). `MutationForm` runs this
 * on submit and surfaces the messages as field errors. The trip dates aren't rendered
 * fields — they're picked in the sibling "Your trip" calendar — but the page mirrors them
 * into the form `values`, so the cross-field night check below gates submission too.
 */
export const createBookingSchema = z
	.object({
		firstName: z.string().trim().min(1, 'Enter your first name'),
		lastName: z.string().trim().min(1, 'Enter your last name'),
		email: z
			.string()
			.trim()
			.min(1, 'Enter your email')
			.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email'),
		phone: z
			.string()
			.refine((value) => value.replace(/\D/g, '').length >= 6, 'Enter a valid phone number'),
		specialRequests: z.string().trim().optional(),
		paymentMethod: z.enum(['cash', 'online'], { message: 'Choose a payment method.' }),
		// Required strings (not nullable): `z.infer` then narrows these to `string` for the
		// mutation — the same narrowing the old `resolveBookingDates` return type gave us.
		checkIn: z.string().min(1, 'Select your dates'),
		checkOut: z.string().min(1, 'Select your dates')
	})
	// Cross-field rule: needs both dates, so it lives on the object via `.refine`, not a field.
	.refine((data) => nightsBetween(data.checkIn, data.checkOut) >= 1, {
		message: 'Your stay must be at least one night',
		path: ['checkOut']
	});
