// CONFIG
import { PAYMENTS_CONFIG } from '@/shared/config';

// TYPES
import type { typesPaymentMethodOption } from '@/features/bookings/types/bookingsSvelteOnlyTypes';

/**
 * Whether any online-payment option may be offered (PaymentsSystemDesign.md §8). Mirrors
 * the backend's `onlinePaymentsEnabled()` — the server-side create/update mutations reject
 * non-cash listings while this is false, so this is the UI half of one gate, not the gate
 * itself.
 */
export const ONLINE_PAYMENTS_ENABLED = PAYMENTS_CONFIG.PROVIDER !== 'none';

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

/**
 * Host-facing options for what an accommodation accepts — includes letting guests choose.
 *
 * The online options disappear entirely while no payment provider is wired: a listing that
 * offered `online` would send guests into a checkout that cannot exist
 * (PaymentsSystemDesign.md §8, §11's last row). Flipping `PAYMENTS_CONFIG.PROVIDER` is what
 * brings them back — that flip IS the launch.
 */
export const ACCOMMODATION_PAYMENT_METHOD_OPTIONS: typesPaymentMethodOption[] = [
	{
		value: 'cash',
		label: 'Cash at check-in',
		description: 'Guests settle the full amount with you on arrival.'
	},
	...(ONLINE_PAYMENTS_ENABLED
		? ([
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
			] as typesPaymentMethodOption[])
		: [])
];
