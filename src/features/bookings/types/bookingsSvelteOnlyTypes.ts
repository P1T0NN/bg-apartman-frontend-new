// Presentation types for bookings Svelte UI — not used by Convex.
// Domain shapes live in @/shared/features/booking/types/bookingTypes.

import type { MutationFormSelectOption } from '@/components/ui/mutation-form/types';
import type { typesStatusConfig } from '@/components/ui/feature-status/types';
import type {
	typesBookingAction,
	typesBookingStatus,
	typesGuestBookingAction,
	typesPaymentStatus
} from '@/shared/features/booking/types/bookingTypes';

/** Booking status → presentation, rendered through `FeatureStatus`. */
export type typesBookingStatusConfig = typesStatusConfig<typesBookingStatus>;

/** Payment status → presentation, rendered through `FeatureStatus`. */
export type typesPaymentStatusConfig = typesStatusConfig<typesPaymentStatus>;

export type typesBookingActionMeta = {
	label: string;
	toast: string;
	variant: 'default' | 'destructive' | 'outline';
};

export type typesBookingActionOption = {
	action: typesBookingAction;
	meta: typesBookingActionMeta;
};

export type typesBookingGuestActionOption = {
	action: typesGuestBookingAction;
	meta: typesBookingActionMeta;
};

export type typesPaymentMethodOption = MutationFormSelectOption & {
	description: string;
};
