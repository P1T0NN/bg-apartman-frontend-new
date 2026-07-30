// SEND
import { sendEmail, reservationUrl, type EmailCtx } from './resend';

// TEMPLATES
import { stayConfirmationRequestTemplate } from './templates/stayConfirmation/stayConfirmationRequestTemplate';

type SendStayConfirmationRequestEmailInput = {
	locale: string;
	bookingId: string;
	bookingCode: string;
	guestFirstName: string;
	guestEmail: string;
	apartmentTitle: string;
	checkInDate: string;
	checkOutDate: string;
	hostName?: string;
};

/** Host asked the guest to confirm their stay: send the guest the one-click link. */
export async function sendStayConfirmationRequestEmail(
	ctx: EmailCtx,
	input: SendStayConfirmationRequestEmailInput
): Promise<void> {
	const content = stayConfirmationRequestTemplate({
		locale: input.locale,
		guestFirstName: input.guestFirstName,
		hostName: input.hostName ?? 'Your host',
		apartmentTitle: input.apartmentTitle,
		bookingCode: input.bookingCode,
		checkInDate: input.checkInDate,
		checkOutDate: input.checkOutDate,
		reservationUrl: reservationUrl(input.bookingId)
	});

	await sendEmail(ctx, input.guestEmail, content);
}
