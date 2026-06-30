// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/** Derived from `bookings.status` in convex/schema.ts — do not duplicate manually. */
export type typesBookingStatus = Doc<'bookings'>['status'];

/** Derived from `bookings.paymentStatus` in convex/schema.ts — do not duplicate manually. */
export type typesPaymentStatus = Doc<'bookings'>['paymentStatus'];
export type typesBookingFilter = 'all' | typesBookingStatus;
export type typesBookingAction = 'confirm' | 'decline' | 'check_in' | 'check_out' | 'cancel';
export type typesGuestBookingAction = 'withdraw' | 'cancel';

/** Partial booking row update produced by a host/guest/system transition. */
export type typesBookingTransitionPatch = {
	status: typesBookingStatus;
	updatedAt: number;
	cancelledAt?: number;
	cancelledBy?: Doc<'bookings'>['cancelledBy'];
	cancelReason?: string;
	pendingExpiresAt?: number;
};

export type typesBookingFilterOption = { value: typesBookingFilter; label: string };
export type typesStatusTone = {
	label: string;
	/** Pill classes (ring style, matches the listings table badges). */
	badgeClass: string;
	/** Solid dot used in stat cards / legends. */
	dotClass: string;
};
export type typesBookingStatusConfig = Record<typesBookingStatus, typesStatusTone>;
export type typesPaymentStatusConfig = Record<typesPaymentStatus, typesStatusTone>;

/**
 * Denormalized listing summary joined onto a booking for list/detail UI. `title`/`city`
 * are projected straight from the `apartments` row so they follow the schema; the rest can't
 * be a plain Pick — `_id`/`type` carry a fallback when the listing row is gone, and `imageUrl`
 * is derived (apartments has no such column). See `resolveApartmentSummary`.
 */
export type typesBookingApartmentSummary = Pick<Doc<'apartments'>, 'title' | 'city'> & {
	_id: string;
	type: Doc<'apartments'>['type'] | '';
	imageUrl: string;
};

/**
 * A booking enriched with its apartment summary — the exact shape the bookings UI consumes
 * and what the "Safe" booking queries return to the client. Derived from `Doc<'bookings'>` so
 * it can't drift from the schema; server-only columns the client never renders are dropped:
 * `apartmentSlug` (the join key `resolveApartmentSummary` reads before returning `apartment`)
 * and `archivedAt` (soft-delete marker).
 */
export type typesBookingSafe = Omit<Doc<'bookings'>, 'apartmentSlug' | 'archivedAt'> & {
	apartment: typesBookingApartmentSummary;
};

/** `/reservations/[id]` — booking row plus listing/host labels for the confirmation UI. */
export type typesReservationBooking = Pick<
	Doc<'bookings'>,
	| 'bookingCode'
	| 'guestEmail'
	| 'checkInDate'
	| 'checkOutDate'
	| 'numberOfAdults'
	| 'numberOfChildren'
	| 'paymentMethod'
	| 'status'
	| 'total'
> & {
	apartmentTitle: string;
	apartmentSlug: string;
	hostName: string;
};
