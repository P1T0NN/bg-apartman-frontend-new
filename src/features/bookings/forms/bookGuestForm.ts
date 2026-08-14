// I18N
import { m } from '@/paraglide/messages';

// TYPES
import type { MutationFormSection } from '@/components/ui/mutation-form/types';

export const bookGuestForm: MutationFormSection[] = [
	{
		id: 'guest-details',
		title: m['BookPage.BookGuestForm.yourDetails'](),
		fields: [
			{
				id: 'firstName',
				label: m['BookPage.BookGuestForm.firstName'](),
				kind: 'input',
				autocomplete: 'given-name',
				placeholder: m['BookPage.BookGuestForm.firstNamePlaceholder'](),
				colSpan: 1
			},
			{
				id: 'lastName',
				label: m['BookPage.BookGuestForm.lastName'](),
				kind: 'input',
				autocomplete: 'family-name',
				placeholder: m['BookPage.BookGuestForm.lastNamePlaceholder'](),
				colSpan: 1
			},
			{
				id: 'email',
				label: m['BookPage.BookGuestForm.email'](),
				kind: 'input',
				type: 'email',
				autocomplete: 'email',
				placeholder: m['BookPage.BookGuestForm.emailPlaceholder'](),
				colSpan: 1
			},
			{
				id: 'phone',
				label: m['BookPage.BookGuestForm.phone'](),
				kind: 'input',
				type: 'tel',
				autocomplete: 'tel',
				placeholder: m['BookPage.BookGuestForm.phonePlaceholder'](),
				colSpan: 1
			},
			{
				id: 'specialRequests',
				label: m['BookPage.BookGuestForm.messageToHost'](),
				kind: 'textarea',
				placeholder: m['BookPage.BookGuestForm.specialRequestsPlaceholder'](),
				description: m['BookPage.BookGuestForm.optional'](),
				rows: 4
			}
		]
	}
];
