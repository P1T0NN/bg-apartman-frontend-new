// Presentation types for bookings Svelte UI — not used by Convex.
// Domain shapes live in @/shared/features/booking/types/bookingTypes.

import type { MutationFormSelectOption } from '@/shared/components/ui/mutation-form/types';
import type {
	typesBookingAction,
	typesBookingStatus,
	typesGuestBookingAction,
	typesPaymentStatus
} from '@/shared/features/booking/types/bookingTypes';

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

export type typesBookingsStatusProps = (
	| { kind: 'booking'; status: typesBookingStatus }
	| { kind: 'payment'; status: typesPaymentStatus }
) & {
	/** 'badge' = ring pill (default), 'dot' = coloured dot + label (legends / compact rows). */
	variant?: 'badge' | 'dot';
	/** Booking only: append a "?" linking to the status guide. Default on. */
	showHelp?: boolean;
};
