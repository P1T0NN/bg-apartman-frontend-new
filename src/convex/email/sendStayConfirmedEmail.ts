// SEND
import { sendEmail, hostBookingUrl, type EmailCtx } from './resend';

// TEMPLATES
import { stayConfirmedTemplate } from './templates/stayConfirmation/stayConfirmedTemplate';

type SendStayConfirmedEmailInput = {
	locale: string;
	bookingId: string;
	bookingCode: string;
	guestName: string;
	hostName: string;
	hostEmail: string;
	apartmentTitle: string;
	checkInDate: string;
};

/** Guest confirmed their stay: close the loop for the host. */
export async function sendStayConfirmedEmail(
	ctx: EmailCtx,
	input: SendStayConfirmedEmailInput
): Promise<void> {
	const content = stayConfirmedTemplate({
		locale: input.locale,
		hostName: input.hostName,
		guestName: input.guestName,
		apartmentTitle: input.apartmentTitle,
		bookingCode: input.bookingCode,
		checkInDate: input.checkInDate,
		// Deep-linked to this booking's sheet — one click from inbox to context (HSD §6).
		reservationsUrl: hostBookingUrl(input.bookingId)
	});

	await sendEmail(ctx, input.hostEmail, content);
}
