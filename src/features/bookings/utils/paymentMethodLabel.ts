// DATA
import { ACCOMMODATION_PAYMENT_METHOD_OPTIONS } from '@/features/bookings/data/paymentMethods';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

type AnyPaymentMethod =
	| Doc<'bookings'>['paymentMethod']
	| NonNullable<Doc<'apartments'>['paymentMethod']>;

/** Display label for a booking's chosen method OR an accommodation's accepted method (incl. `both`). */
export function paymentMethodLabel(method: AnyPaymentMethod): string {
	return (
		ACCOMMODATION_PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label ?? method
	);
}
