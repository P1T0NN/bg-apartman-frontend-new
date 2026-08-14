import { m } from '@/paraglide/messages';

// FORMS
import { addAccommodationForm } from '@/features/accommodations/forms/addAccommodationForm';

// TYPES
import type { MutationFormSection } from '@/components/ui/mutation-form/types';

// LUCIDE ICONS
import UserRoundCheckIcon from '@lucide/svelte/icons/user-round-check';

/**
 * Admin add-accommodation wizard: an extra mandatory "Owner" section (who the
 * accommodation belongs to) followed by the same sections hosts fill in.
 */
export const adminAddAccommodationForm: MutationFormSection[] = [
	{
		id: 'owner',
		title: m['AdminAddAccommodationPage.AdminAddAccommodationForm.owner'](),
		description: m['AdminAddAccommodationPage.AdminAddAccommodationForm.ownerDescription'](),
		icon: UserRoundCheckIcon,
		fields: [{ id: 'hostId', label: m['AdminAddAccommodationPage.AdminAddAccommodationForm.owner'](), kind: 'input', required: true, colSpan: 2 }]
	},
	...addAccommodationForm
];
