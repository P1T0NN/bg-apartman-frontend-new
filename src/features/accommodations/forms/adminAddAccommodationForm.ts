// FORMS
import { addAccommodationForm } from '@/features/accommodations/forms/addAccommodationForm';

// TYPES
import type { MutationFormSection } from '@/shared/components/ui/mutation-form/types';

// LUCIDE ICONS
import UserRoundCheckIcon from '@lucide/svelte/icons/user-round-check';

/**
 * Admin add-accommodation wizard: an extra mandatory "Owner" section (who the
 * accommodation belongs to) followed by the same sections hosts fill in.
 */
export const adminAddAccommodationForm: MutationFormSection[] = [
	{
		id: 'owner',
		title: 'Owner',
		description: 'Search for the user this accommodation belongs to — they become its host.',
		icon: UserRoundCheckIcon,
		fields: [{ id: 'hostId', label: 'Owner', kind: 'input', required: true, colSpan: 2 }]
	},
	...addAccommodationForm
];
