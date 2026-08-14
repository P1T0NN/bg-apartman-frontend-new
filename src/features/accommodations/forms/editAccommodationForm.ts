import { m } from '@/lib/paraglide/messages';

// FORMS
import { addAccommodationForm, PAYMENTS_SECTION_ID } from './addAccommodationForm';

// TYPES
import type { MutationFormSection } from '@/components/ui/mutation-form/types';

/**
 * Edit form layout: identical to {@link addAccommodationForm} except two sections.
 *
 *  - **Photos** carries two fields here — a custom `keepImageKeys` field showing the
 *    current photos (each removable) and the standard uploader for adding more.
 *  - **Payments & plan** keeps the guest payment method but DROPS the plan field: a
 *    listing's monetization is not editable (AccommodationsSystemDesign.md §2/A3 — the
 *    update mutation's validator doesn't even accept it). The only way it ever changes is
 *    the one-way switch, which has its own mutation and its own dialog on the
 *    my-accommodations row (§8 "Switching models"). Rendering a plan picker here would
 *    offer a choice the server silently ignores.
 *
 * Every other section is shared as-is so Add and Edit never drift apart.
 */
export const editAccommodationForm: MutationFormSection[] = addAccommodationForm.map(
	(section): MutationFormSection => {
		if (section.id === 'photos') {
			return {
				...section,
				description: m['HostEditAccommodationPage.EditAccommodationForm.removePhotosDescription'](),
				fields: [
					{ id: 'keepImageKeys', label: m['HostEditAccommodationPage.EditAccommodationForm.currentPhotos'](), kind: 'input', colSpan: 2 },
					{
						id: 'photos',
						label: m['HostEditAccommodationPage.EditAccommodationForm.addMorePhotos'](),
						kind: 'upload-multiple',
						accept: 'image/*',
						colSpan: 2
					}
				]
			};
		}

		if (section.id === PAYMENTS_SECTION_ID) {
			return {
				...section,
				title: m['HostEditAccommodationPage.EditAccommodationForm.payments'](),
				description: m['HostEditAccommodationPage.EditAccommodationForm.paymentsDescription'](),
				fields: section.fields.filter((field) => field.id !== 'monetization')
			};
		}

		return section;
	}
);
