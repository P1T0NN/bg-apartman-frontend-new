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

/** Appended to an online option's copy while the provider is dark — the same sentence the
 *  per-booking plan card uses, so one section never explains the same gate two ways. */
const COMING_SOON = ' Available once online payments launch.';

/**
 * Host-facing options for what an accommodation accepts — includes letting guests choose.
 *
 * The online options are always LISTED but **disabled** while no payment provider is wired:
 * a listing that offered `online` would send guests into a checkout that cannot exist
 * (PaymentsSystemDesign.md §8, §11's last row), yet hiding them entirely left hosts unable
 * to see what the platform will support. Visible-but-disabled is the same treatment the
 * per-booking plan card gets in this section — and the server-side gate in
 * create/update is unchanged, so this is still the UI half of one gate, never the gate.
 * Flipping `PAYMENTS_CONFIG.PROVIDER` is what enables them — that flip IS the launch.
 */
export const ACCOMMODATION_PAYMENT_METHOD_OPTIONS: typesPaymentMethodOption[] = [
	{
		value: 'cash',
		label: 'Cash at check-in',
		description: 'Guests settle the full amount with you on arrival.'
	},
	{
		value: 'online',
		label: 'Pay online',
		description:
			'Guests pay online when the booking is confirmed.' +
			(ONLINE_PAYMENTS_ENABLED ? '' : COMING_SOON),
		disabled: !ONLINE_PAYMENTS_ENABLED
	},
	{
		value: 'both',
		label: 'Both — let guests choose',
		description:
			'Guests pick between cash at check-in and paying online at checkout.' +
			(ONLINE_PAYMENTS_ENABLED ? '' : COMING_SOON),
		disabled: !ONLINE_PAYMENTS_ENABLED
	}
];
