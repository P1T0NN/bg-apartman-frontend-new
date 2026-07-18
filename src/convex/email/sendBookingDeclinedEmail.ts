// SEND
import { sendEmail, homeUrl, type EmailCtx } from './resend';

// TEMPLATES
import { bookingDeclinedTemplate } from './templates/bookingDeclined/bookingDeclinedTemplate';

type SendBookingDeclinedEmailInput = {
	locale: string;
	bookingCode: string;
	guestFirstName: string;
	guestEmail: string;
	apartmentTitle: string;
	declineReason: string;
	checkInDate: string;
	checkOutDate: string;
};

/** When a host declines a pending request: tell the guest, with the reason. */
export async function sendBookingDeclinedEmail(
	ctx: EmailCtx,
	input: SendBookingDeclinedEmailInput
): Promise<void> {
	const content = bookingDeclinedTemplate({
		locale: input.locale,
		guestFirstName: input.guestFirstName,
		apartmentTitle: input.apartmentTitle,
		bookingCode: input.bookingCode,
		declineReason: input.declineReason,
		checkInDate: input.checkInDate,
		checkOutDate: input.checkOutDate,
		browseUrl: homeUrl()
	});

	await sendEmail(ctx, input.guestEmail, content);
}
