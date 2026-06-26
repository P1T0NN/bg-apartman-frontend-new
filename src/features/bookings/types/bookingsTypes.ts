// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/** Derived from `bookings.status` in convex/schema.ts — do not duplicate manually. */
export type BookingStatus = Doc<'bookings'>['status'];

/** Derived from `bookings.paymentStatus` in convex/schema.ts — do not duplicate manually. */
export type PaymentStatus = Doc<'bookings'>['paymentStatus'];
export type BookingFilter = 'all' | BookingStatus;
export type BookingAction = 'confirm' | 'decline' | 'check_in' | 'check_out' | 'cancel';
export type BookingFilterOption = { value: BookingFilter; label: string };
export type BookingStatusConfig = Record<BookingStatus, StatusTone>;
export type PaymentStatusConfig = Record<PaymentStatus, StatusTone>;

/** Denormalized listing summary joined onto a booking for list/detail UI. */
export type BookingApartmentSummary = {
	_id: string;
	title: string;
	city: string;
	type: string;
	imageUrl: string;
};

export type StatusTone = {
	label: string;
	/** Pill classes (ring style, matches the listings table badges). */
	badgeClass: string;
	/** Solid dot used in stat cards / legends. */
	dotClass: string;
};
