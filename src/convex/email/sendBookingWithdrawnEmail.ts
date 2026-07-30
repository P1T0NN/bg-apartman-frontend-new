// SEND
import { sendEmail, hostBookingUrl, type EmailCtx } from './resend';

// TEMPLATES
import { bookingWithdrawnTemplate } from './templates/bookingWithdrawn/bookingWithdrawnTemplate';

type SendBookingWithdrawnEmailInput = {
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
 * When a guest withdraws a pending request: polite FYI to the host
 * (BookingSystemDesign.md §8 — the guest gets nothing, they just did it themselves).
 */
export async function sendBookingWithdrawnEmail(
	ctx: EmailCtx,
	input: SendBookingWithdrawnEmailInput
): Promise<void> {
	const content = bookingWithdrawnTemplate({
		locale: input.locale,
		hostName: input.hostName,
		guestName: input.guestName,
		apartmentTitle: input.apartmentTitle,
		bookingCode: input.bookingCode,
		checkInDate: input.checkInDate,
		checkOutDate: input.checkOutDate,
		// Deep-linked to this booking's sheet — one click from inbox to context (HSD §6).
		reservationsUrl: hostBookingUrl(input.bookingId)
	});

	await sendEmail(ctx, input.hostEmail, content);
}
