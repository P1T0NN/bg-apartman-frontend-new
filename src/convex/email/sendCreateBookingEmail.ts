// SEND
import { sendEmail, reservationUrl, type EmailCtx } from './resend';

// TEMPLATES
import { createBookingForGuestTemplate } from './templates/createBooking/createBookingForGuestTemplate';
import { createBookingForOwnerTemplate } from './templates/createBooking/createBookingForOwnerTemplate';

/** Everything both booking emails (guest confirmation + owner notification) need. */
type SendCreateBookingEmailInput = {
	locale: string;
	bookingId: string;
	bookingCode: string;
	apartmentTitle: string;
	checkInDate: string;
	checkOutDate: string;
	numberOfAdults: number;
	numberOfChildren: number;
	total: number;
	currency: string;
	instantBooking: boolean;
	// guest
	guestFirstName: string;
	guestLastName: string;
	guestEmail: string;
	guestPhone: string;
	// owner
	hostName: string;
	hostEmail: string;
};

/**
 * On a new booking: send the confirmation to the guest and the notification to the owner.
 * Call from the mutation that creates the booking, after the insert succeeds.
 */
export async function sendCreateBookingEmail(ctx: EmailCtx, input: SendCreateBookingEmailInput): Promise<void> {
	const url = reservationUrl(input.bookingId);

	const guestEmailContent = createBookingForGuestTemplate({
		locale: input.locale,
		guestFirstName: input.guestFirstName,
		apartmentTitle: input.apartmentTitle,
		bookingCode: input.bookingCode,
		checkInDate: input.checkInDate,
		checkOutDate: input.checkOutDate,
		numberOfAdults: input.numberOfAdults,
		numberOfChildren: input.numberOfChildren,
		total: input.total,
		currency: input.currency,
		instantBooking: input.instantBooking,
		reservationUrl: url
	});

	const ownerEmailContent = createBookingForOwnerTemplate({
		locale: input.locale,
		hostName: input.hostName,
		guestName: `${input.guestFirstName} ${input.guestLastName}`.trim(),
		guestEmail: input.guestEmail,
		guestPhone: input.guestPhone,
		apartmentTitle: input.apartmentTitle,
		bookingCode: input.bookingCode,
		checkInDate: input.checkInDate,
		checkOutDate: input.checkOutDate,
		numberOfAdults: input.numberOfAdults,
		numberOfChildren: input.numberOfChildren,
		total: input.total,
		currency: input.currency,
		instantBooking: input.instantBooking,
		bookingUrl: url
	});

	await sendEmail(ctx, input.guestEmail, guestEmailContent);
	
	if (input.hostEmail) {
		await sendEmail(ctx, input.hostEmail, ownerEmailContent);
	}
}
