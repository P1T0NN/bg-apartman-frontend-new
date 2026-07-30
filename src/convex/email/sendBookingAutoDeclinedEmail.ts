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
	/** Defaults to `expired` (the 48h window lapsed). */
	reason?: 'expired' | 'dates_taken';
};

/** When a pending request ends without a host decision: tell the guest which way it ended. */
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
		browseUrl: homeUrl(),
		reason: input.reason
	});

	await sendEmail(ctx, input.guestEmail, content);
}
