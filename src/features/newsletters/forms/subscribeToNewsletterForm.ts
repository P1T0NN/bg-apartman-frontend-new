// TYPES
import type { MutationFormSection } from '@/shared/components/ui/mutation-form/types';

export const subscribeToNewsletterForm: MutationFormSection[] = [
	{
		plain: true,
		columns: 1,
		class: 'flex-1 min-w-0 gap-0',
		fields: [
			{
				id: 'email',
				label: '',
				kind: 'input',
				type: 'email',
				placeholder: 'Enter your email',
				autocomplete: 'email',
				// The visible label lives nowhere in this design; hide the (empty) field label so it
				// adds no height above the input and the input top-aligns with the Subscribe button.
				fieldClass: 'gap-1.5 [&_[data-slot=field-label]]:hidden'
			}
		]
	}
];
