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
		firstName: z.string().trim().min(1, 'ValidationMessages.createBookingSchema.firstNameRequired'),
		lastName: z.string().trim().min(1, 'ValidationMessages.createBookingSchema.lastNameRequired'),
		email: z
			.string()
			.trim()
			.min(1, 'ValidationMessages.createBookingSchema.emailRequired')
			.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'ValidationMessages.createBookingSchema.invalidEmail'),
		phone: z
			.string()
			.refine(
				(value) => value.replace(/\D/g, '').length >= 6,
				'ValidationMessages.createBookingSchema.invalidPhone'
			),
		specialRequests: z.string().trim().optional(),
		paymentMethod: z.enum(['cash', 'online'], {
			message: 'ValidationMessages.createBookingSchema.paymentMethodRequired'
		}),
		// Required strings (not nullable): `z.infer` then narrows these to `string` for the
		// mutation — the same narrowing the old `resolveBookingDates` return type gave us.
		checkIn: z.string().min(1, 'ValidationMessages.createBookingSchema.datesRequired'),
		checkOut: z.string().min(1, 'ValidationMessages.createBookingSchema.datesRequired')
	})
	// Cross-field rule: needs both dates, so it lives on the object via `.refine`, not a field.
	.refine((data) => nightsBetween(data.checkIn, data.checkOut) >= 1, {
		message: 'ValidationMessages.createBookingSchema.minOneNight',
		path: ['checkOut']
	});
