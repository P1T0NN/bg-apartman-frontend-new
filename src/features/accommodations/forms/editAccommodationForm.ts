// FORMS
import { addAccommodationForm } from './addAccommodationForm';

// TYPES
import type { MutationFormSection } from '@/shared/components/ui/mutation-form/types';

/**
 * Edit form layout: identical to {@link addAccommodationForm} except the Photos
 * section. Here it carries two fields — a custom `keepImageKeys` field that shows the
 * current photos (each removable) and the standard `photos` uploader for adding more.
 * The rest of the sections are shared as-is so Add and Edit never drift apart.
 */
export const editAccommodationForm: MutationFormSection[] = addAccommodationForm.map(
	(section): MutationFormSection =>
		section.id === 'photos'
			? {
					...section,
					description:
						'Remove any photo you no longer want, and upload more to round out the listing.',
					fields: [
						{ id: 'keepImageKeys', label: 'Current photos', kind: 'input', colSpan: 2 },
						{
							id: 'photos',
							label: 'Add more photos',
							kind: 'upload-multiple',
							accept: 'image/*',
							colSpan: 2
						}
					]
				}
			: section
);
