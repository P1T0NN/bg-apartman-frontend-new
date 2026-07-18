// TYPES
import type { typesPaymentMethodOption } from '@/features/bookings/types/bookingsSvelteOnlyTypes';

/** Guest-facing checkout choices — a booking is always paid one way or the other. */
export const PAYMENT_METHOD_OPTIONS: typesPaymentMethodOption[] = [
	{
		value: 'cash',
		label: 'Cash at check-in',
		description: 'No card needed — settle the full amount with your host on arrival.'
	},
	{
		value: 'online',
		label: 'Pay online',
		description: 'Pay securely online — your card is charged when the booking is confirmed.'
	}
];

/** Host-facing options for what an accommodation accepts — includes letting guests choose. */
export const ACCOMMODATION_PAYMENT_METHOD_OPTIONS: typesPaymentMethodOption[] = [
	{
		value: 'cash',
		label: 'Cash at check-in',
		description: 'Guests settle the full amount with you on arrival.'
	},
	{
		value: 'online',
		label: 'Pay online',
		description: 'Guests pay online when the booking is confirmed.'
	},
	{
		value: 'both',
		label: 'Both — let guests choose',
		description: 'Guests pick between cash at check-in and paying online at checkout.'
	}
];
