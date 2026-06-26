import type { MutationFormSelectOption } from '@/shared/components/ui/mutation-form/types';

export type PaymentMethod = 'cash';

export const PAYMENT_METHOD_OPTIONS: MutationFormSelectOption[] = [
	{ value: 'cash', label: 'Cash at check-in' }
];

export function paymentMethodLabel(method: PaymentMethod): string {
	return PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label ?? method;
}

export function paymentMethodDescription(method: PaymentMethod): string {
	if (method === 'cash')
		return 'No card needed — settle the full amount with your host on arrival.';
	return '';
}
