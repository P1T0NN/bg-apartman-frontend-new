// SEND
import { sendEmail, homeUrl, type EmailCtx } from './resend';

// TEMPLATES
import { bookingCancelledTemplate } from './templates/bookingCancelled/bookingCancelledTemplate';

type SendBookingCancelledEmailInput = {
	locale: string;
	bookingCode: string;
	guestFirstName: string;
	guestEmail: string;
	apartmentTitle: string;
	checkInDate: string;
	checkOutDate: string;
	/** Cancellation reason to surface in the email. */
	cancelReason?: string;
};

/** When a booking is cancelled: tell the guest. */
export async function sendBookingCancelledEmail(
	ctx: EmailCtx,
	input: SendBookingCancelledEmailInput
): Promise<void> {
	const content = bookingCancelledTemplate({
		locale: input.locale,
		guestFirstName: input.guestFirstName,
		apartmentTitle: input.apartmentTitle,
		bookingCode: input.bookingCode,
		checkInDate: input.checkInDate,
		checkOutDate: input.checkOutDate,
		cancelReason: input.cancelReason,
		browseUrl: homeUrl()
	});

	await sendEmail(ctx, input.guestEmail, content);
}
