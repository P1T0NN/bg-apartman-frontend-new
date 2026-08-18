// I18N
import { m } from '@/lib/paraglide/messages';

// CONFIG
import { ONLINE_PAYMENTS_AVAILABLE } from '@/shared/config';

// TYPES
import type { typesPaymentMethodOption } from '@/features/bookings/types/bookingsSvelteOnlyTypes';

/**
 * Whether any online-payment option may be offered (PaymentsSystemDesign.md §8). The
 * config's single gate — provider wired AND Phase 2 shipped — is what the server-side
 * create/update mutations enforce too, so this is the UI half of one gate, not the gate.
 */
export const ONLINE_PAYMENTS_ENABLED = ONLINE_PAYMENTS_AVAILABLE;

/** Guest-facing checkout choices — a booking is always paid one way or the other. */
export const PAYMENT_METHOD_OPTIONS: typesPaymentMethodOption[] = [
	{
		value: 'cash',
		label: m['paymentMethods.cashAtCheckIn'](),
		description: m['paymentMethods.cashDescription']()
	},
	{
		value: 'online',
		label: m['paymentMethods.payOnline'](),
		description: m['paymentMethods.payOnlineDescription']()
	}
];

/** Appended to an online option's copy while the provider is dark — the same sentence the
 *  per-booking plan card uses, so one section never explains the same gate two ways. */
const COMING_SOON = m['paymentMethods.comingSoon']();

/**
 * Host-facing options for what an accommodation accepts — includes letting guests choose.
 *
 * The online options are always LISTED but **disabled** while online payments do not exist
 * (provider unwired OR Phase 2 not shipped): a listing that offered `online` would send
 * guests into a checkout that cannot exist (PaymentsSystemDesign.md §8, §11's last row),
 * yet hiding them entirely left hosts unable to see what the platform will support.
 * Visible-but-disabled is the same treatment the per-booking plan card gets in this
 * section — and the server-side gate in create/update is unchanged, so this is still the
 * UI half of one gate, never the gate. Flipping `ONLINE_PAYMENTS_AVAILABLE` in config is
 * what enables them — that flip IS the Phase-2 launch.
 */
export const ACCOMMODATION_PAYMENT_METHOD_OPTIONS: typesPaymentMethodOption[] = [
	{
		value: 'cash',
		label: m['paymentMethods.cashAtCheckIn'](),
		description: m['paymentMethods.accommodationCashDescription']()
	},
	{
		value: 'online',
		label: m['paymentMethods.payOnline'](),
		description:
			m['paymentMethods.accommodationPayOnlineDescription']() +
			(ONLINE_PAYMENTS_ENABLED ? '' : COMING_SOON),
		disabled: !ONLINE_PAYMENTS_ENABLED
	},
	{
		value: 'both',
		label: m['paymentMethods.both'](),
		description:
			m['paymentMethods.bothDescription']() +
			(ONLINE_PAYMENTS_ENABLED ? '' : COMING_SOON),
		disabled: !ONLINE_PAYMENTS_ENABLED
	}
];
