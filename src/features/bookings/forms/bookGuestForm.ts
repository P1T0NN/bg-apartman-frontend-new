// TYPES
import type { MutationFormSection } from '@/shared/components/ui/mutation-form/types';

export const bookGuestForm: MutationFormSection[] = [
	{
		id: 'guest-details',
		title: 'Your details',
		plain: true,
		fields: [
			{
				id: 'firstName',
				label: 'First name',
				kind: 'input',
				autocomplete: 'given-name',
				placeholder: 'Marko',
				colSpan: 1
			},
			{
				id: 'lastName',
				label: 'Last name',
				kind: 'input',
				autocomplete: 'family-name',
				placeholder: 'Marković',
				colSpan: 1
			},
			{
				id: 'email',
				label: 'Email',
				kind: 'input',
				type: 'email',
				autocomplete: 'email',
				placeholder: 'you@example.com',
				colSpan: 1
			},
			{
				id: 'phone',
				label: 'Phone',
				kind: 'input',
				type: 'tel',
				autocomplete: 'tel',
				placeholder: '+381 6X XXX XXXX',
				colSpan: 1
			},
			{
				id: 'specialRequests',
				label: 'Message to host',
				kind: 'textarea',
				placeholder: 'Arrival time, special requests, anything the host should know…',
				description: 'Optional',
				rows: 4
			}
		]
	}
];
