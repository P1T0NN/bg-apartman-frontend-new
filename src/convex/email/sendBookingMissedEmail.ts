// SEND
import { sendEmail, hostBookingUrl, type EmailCtx } from './resend';

// TEMPLATES
import { bookingMissedTemplate } from './templates/bookingMissed/bookingMissedTemplate';

type SendBookingMissedEmailInput = {
	locale: string;
	bookingId: string;
	bookingCode: string;
	guestName: string;
	hostName: string;
	hostEmail: string;
	apartmentTitle: string;
	checkInDate: string;
	checkOutDate: string;
};

/**
 * When a request expires unanswered: the host's "you missed one" nudge
 * (BookingSystemDesign.md §8). Sent by the lifecycle cron alongside the guest's
 * auto-decline email — once per event, never a drip.
 */
export async function sendBookingMissedEmail(
	ctx: EmailCtx,
	input: SendBookingMissedEmailInput
): Promise<void> {
	const content = bookingMissedTemplate({
		locale: input.locale,
		hostName: input.hostName,
		guestName: input.guestName,
		apartmentTitle: input.apartmentTitle,
		bookingCode: input.bookingCode,
		checkInDate: input.checkInDate,
		checkOutDate: input.checkOutDate,
		bookingUrl: hostBookingUrl(input.bookingId)
	});

	await sendEmail(ctx, input.hostEmail, content);
}
