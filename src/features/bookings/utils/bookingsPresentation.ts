// Presentation helpers shared by the Bookings page components: filter/search logic
// and the (dummy) action state machine. Formatters, status styling, and filter taxonomy live
// in shared utils / bookingsData.

import type {
	typesBookingSafe,
	typesBookingStatus,
	typesBookingAction,
	typesGuestBookingAction,
	typesBookingFilter
} from '@/shared/features/booking/types/bookingTypes';
import {
	guestMayCancelConfirmed
} from '@/shared/features/booking/utils/guestMayCancelConfirmedBooking';
import { todayIsoUtc } from '@/shared/features/booking/utils/daysUntilCheckIn';

const CLOSED_STATUSES = new Set<typesBookingStatus>(['cancelled', 'declined', 'auto_declined']);

export function matchesFilter(b: typesBookingSafe, filter: typesBookingFilter): boolean {
	if (filter === 'all') return true;
	if (filter === 'cancelled') return CLOSED_STATUSES.has(b.status);
	return b.status === filter;
}

/** Count of bookings per filter, for the badges on the segmented control. */
export function countByFilter(bookings: typesBookingSafe[]): Record<typesBookingFilter, number> {
	const counts: Record<typesBookingFilter, number> = {
		all: bookings.length,
		pending: 0,
		confirmed: 0,
		checked_in: 0,
		checked_out: 0,
		declined: 0,
		auto_declined: 0,
		cancelled: 0
	};
	for (const b of bookings) {
		if (CLOSED_STATUSES.has(b.status)) counts.cancelled += 1;
		else counts[b.status] += 1;
	}
	return counts;
}

/** Free-text match across the fields a host is likely to search by. */
export function matchesSearch(b: typesBookingSafe, query: string): boolean {
	const q = query.trim().toLowerCase();
	if (!q) return true;
	return [
		`${b.guestFirstName} ${b.guestLastName}`,
		b.bookingCode,
		b.guestEmail,
		b.guestPhone,
		b.apartment.title,
		b.apartment.city
	].some((field) => field.toLowerCase().includes(q));
}

// === ACTION STATE MACHINE (dummy) ============================================
// Mirrors the transitions a real mutation would perform. Returns a fresh record
// so callers can swap it into reactive state without mutating the source.

type ActionMeta = { label: string; toast: string; variant: 'default' | 'destructive' | 'outline' };

/** Buttons offered in the detail sheet for a given status, in priority order. */
export function availableActions(
	status: typesBookingStatus
): { action: typesBookingAction; meta: ActionMeta }[] {
	switch (status) {
		case 'pending':
			return [
				{
					action: 'confirm',
					meta: { label: 'Confirm booking', toast: 'Booking confirmed', variant: 'default' }
				},
				{
					action: 'decline',
					meta: { label: 'Decline', toast: 'Request declined', variant: 'destructive' }
				}
			];
		case 'confirmed':
			return [
				{
					action: 'check_in',
					meta: { label: 'Check in guest', toast: 'Guest checked in', variant: 'default' }
				},
				{
					action: 'cancel',
					meta: { label: 'Cancel booking', toast: 'Booking cancelled', variant: 'destructive' }
				}
			];
		case 'checked_in':
			return [
				{
					action: 'check_out',
					meta: { label: 'Check out guest', toast: 'Stay completed', variant: 'default' }
				}
			];
		default:
			return [];
	}
}

export function actionToast(action: typesBookingAction): string {
	switch (action) {
		case 'confirm':
			return 'Booking confirmed';
		case 'decline':
			return 'Request declined';
		case 'check_in':
			return 'Guest checked in';
		case 'check_out':
			return 'Stay completed';
		case 'cancel':
			return 'Booking cancelled';
	}
}

/** Apply an action, returning a new booking record with updated status fields. */
export function applyBookingAction(b: typesBookingSafe, action: typesBookingAction): typesBookingSafe {
	const now = Date.now();
	switch (action) {
		case 'confirm':
			return { ...b, status: 'confirmed', updatedAt: now };
		case 'check_in':
			return { ...b, status: 'checked_in', updatedAt: now };
		case 'check_out':
			return { ...b, status: 'checked_out', updatedAt: now };
		case 'decline':
			return { ...b, status: 'declined', updatedAt: now, cancelReason: 'Declined by host.' };
		case 'cancel':
			return {
				...b,
				status: 'cancelled',
				paymentStatus: b.paymentStatus === 'paid' ? 'refunded' : b.paymentStatus,
				cancelledBy: 'host',
				cancelledAt: now,
				cancelReason: 'Cancelled by host.',
				updatedAt: now
			};
	}
}

/** Guest-side actions for the reservation page / my bookings (dummy until wired). */
export function availableGuestActions(
	b: typesBookingSafe
): { action: typesGuestBookingAction; meta: ActionMeta }[] {
	const today = todayIsoUtc();
	if (b.status === 'pending') {
		return [
			{
				action: 'withdraw',
				meta: { label: 'Withdraw request', toast: 'Request withdrawn', variant: 'outline' }
			}
		];
	}
	if (b.status === 'confirmed' && guestMayCancelConfirmed(b.checkInDate, today)) {
		return [
			{
				action: 'cancel',
				meta: { label: 'Cancel booking', toast: 'Booking cancelled', variant: 'destructive' }
			}
		];
	}
	return [];
}

export function applyGuestBookingAction(
	b: typesBookingSafe,
	action: typesGuestBookingAction
): typesBookingSafe {
	const now = Date.now();
	if (action === 'withdraw') {
		return {
			...b,
			status: 'cancelled',
			cancelledBy: 'guest',
			cancelledAt: now,
			cancelReason: 'Withdrawn by guest.',
			updatedAt: now
		};
	}
	return {
		...b,
		status: 'cancelled',
		cancelledBy: 'guest',
		cancelledAt: now,
		cancelReason: 'Cancelled by guest.',
		updatedAt: now
	};
}
