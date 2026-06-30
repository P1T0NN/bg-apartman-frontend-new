// SEND
import { sendEmail, reservationUrl, type EmailCtx } from './resend';

// TEMPLATES
import { bookingConfirmedTemplate } from './templates/bookingConfirmed/bookingConfirmedTemplate';

type SendBookingConfirmedEmailInput = {
	locale: string;
	bookingId: string;
	bookingCode: string;
	guestFirstName: string;
	guestEmail: string;
	apartmentTitle: string;
	checkInDate: string;
	checkOutDate: string;
	numberOfAdults: number;
	numberOfChildren: number;
	total: number;
	currency: string;
};

/** When a pending booking is confirmed by the host: tell the guest. */
export async function sendBookingConfirmedEmail(
	ctx: EmailCtx,
	input: SendBookingConfirmedEmailInput
): Promise<void> {
	const content = bookingConfirmedTemplate({
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
		reservationUrl: reservationUrl(input.bookingId)
	});

	await sendEmail(ctx, input.guestEmail, content);
}
