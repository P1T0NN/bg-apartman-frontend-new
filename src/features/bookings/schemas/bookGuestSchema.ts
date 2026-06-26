// LIBRARIES
import { z } from 'zod';

/**
 * Validates the booking guest-details form (raw string inputs). Same rules the old
 * hand-rolled form enforced; `MutationForm` runs this on submit and surfaces the
 * messages as field errors. Dates aren't part of this form (they live in a sibling
 * section), so they're gated separately in the component.
 */
export const bookGuestSchema = z.object({
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
	paymentMethod: z.enum(['cash'], { message: 'Choose a payment method.' })
});
