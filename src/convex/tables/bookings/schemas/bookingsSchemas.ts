// LIBRARIES
import { v } from 'convex/values';

export const bookingStatus = v.union(
	v.literal('pending'),
	v.literal('confirmed'),
	v.literal('checked_in'),
	v.literal('checked_out'),
	v.literal('declined'),
	v.literal('auto_declined'),
	v.literal('cancelled')
);

export const paymentStatus = v.union(
	v.literal('pending'),
	v.literal('paid'),
	v.literal('refunded')
);

// check_in / check_out are cron-driven, not host actions — see the booking-lifecycle cron.
export const bookingAction = v.union(
	v.literal('confirm'),
	v.literal('decline'),
	v.literal('cancel')
);

export const guestBookingAction = v.union(v.literal('withdraw'), v.literal('cancel'));
