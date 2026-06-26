// LIBRARIES
import { v } from 'convex/values';

export const bookingStatus = v.union(
	v.literal('pending'),
	v.literal('confirmed'),
	v.literal('checked_in'),
	v.literal('checked_out'),
	v.literal('cancelled')
);

export const paymentStatus = v.union(
	v.literal('pending'),
	v.literal('paid'),
	v.literal('refunded')
);

export const bookingAction = v.union(
	v.literal('confirm'),
	v.literal('decline'),
	v.literal('check_in'),
	v.literal('check_out'),
	v.literal('cancel')
);
