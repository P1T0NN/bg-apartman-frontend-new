import type { MutationFormSelectOption } from '@/shared/components/ui/mutation-form/types';

export type PaymentMethod = 'cash' | 'online';

export type PaymentMethodOption = MutationFormSelectOption & {
	description: string;
};

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
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

export function paymentMethodLabel(method: PaymentMethod): string {
	return PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label ?? method;
}
