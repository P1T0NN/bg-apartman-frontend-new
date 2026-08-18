import { ConvexError } from 'convex/values';
import { PAYMENTS_CONFIG } from '@/shared/config';
import type { PaymentAdapter } from '@/shared/features/payments/paymentTypes';
import { stripeAdapter } from './stripe/stripe';

/**
 * Selects the provider implementation (the contract lives in
 * `@/shared/features/payments/paymentTypes`). Throws while
 * `PAYMENTS_CONFIG.PROVIDER` is `'none'` so payment surfaces fail fast with a clean
 * error instead of deep inside an SDK call.
 */
export function getPaymentAdapter(): PaymentAdapter {
	if (PAYMENTS_CONFIG.PROVIDER !== 'stripe') {
		throw new ConvexError({
			code: 'PAYMENTS_DISABLED',
			message: { key: 'GenericMessages.PAYMENTS_DISABLED' }
		});
	}
	return stripeAdapter;
}
