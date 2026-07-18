// SEND
import { sendEmail, homeUrl, type EmailCtx } from './resend';

// TEMPLATES
import { bookingAutoDeclinedTemplate } from './templates/bookingAutoDeclined/bookingAutoDeclinedTemplate';

type SendBookingAutoDeclinedEmailInput = {
	locale: string;
	bookingCode: string;
	guestFirstName: string;
	guestEmail: string;
	apartmentTitle: string;
	checkInDate: string;
	checkOutDate: string;
};

/** When a pending request expires unanswered: tell the guest it lapsed. */
export async function sendBookingAutoDeclinedEmail(
	ctx: EmailCtx,
	input: SendBookingAutoDeclinedEmailInput
): Promise<void> {
	const content = bookingAutoDeclinedTemplate({
		locale: input.locale,
		guestFirstName: input.guestFirstName,
		apartmentTitle: input.apartmentTitle,
		bookingCode: input.bookingCode,
		checkInDate: input.checkInDate,
		checkOutDate: input.checkOutDate,
		browseUrl: homeUrl()
	});

	await sendEmail(ctx, input.guestEmail, content);
}
