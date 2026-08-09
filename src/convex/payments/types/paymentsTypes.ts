// LIBRARIES
import type { Doc } from '@/convex/_generated/dataModel';

/** The payment columns a settlement writes — merged into the booking's transition patch. */
export type PaymentSettlementPatch = {
	paymentStatus?: Doc<'bookings'>['paymentStatus'];
	paymentFlag?: Doc<'bookings'>['paymentFlag'];
};
