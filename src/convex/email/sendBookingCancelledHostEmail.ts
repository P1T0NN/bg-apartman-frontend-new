// SEND
import { sendEmail, hostBookingUrl, type EmailCtx } from './resend';

// TEMPLATES
import { bookingCancelledHostTemplate } from './templates/bookingCancelled/bookingCancelledHostTemplate';

type SendBookingCancelledHostEmailInput = {
	locale: string;
	bookingId: string;
	bookingCode: string;
	guestName: string;
	hostName: string;
	hostEmail: string;
	apartmentTitle: string;
	checkInDate: string;
	checkOutDate: string;
	cancelReason?: string;
	cancelledBy: 'guest' | 'host' | 'admin';
};

/**
 * The host's side of every cancellation email row in BookingSystemDesign.md §8:
 * guest cancelled → "dates freed"; host cancelled → receipt; admin cancelled → notice
 * with the reason. Guests get {@link sendBookingCancelledEmail}, never this.
 */
export async function sendBookingCancelledHostEmail(
	ctx: EmailCtx,
	input: SendBookingCancelledHostEmailInput
): Promise<void> {
	const content = bookingCancelledHostTemplate({
		locale: input.locale,
		hostName: input.hostName,
		guestName: input.guestName,
		apartmentTitle: input.apartmentTitle,
		bookingCode: input.bookingCode,
		checkInDate: input.checkInDate,
		checkOutDate: input.checkOutDate,
		cancelReason: input.cancelReason,
		cancelledBy: input.cancelledBy,
		bookingUrl: hostBookingUrl(input.bookingId)
	});

	await sendEmail(ctx, input.hostEmail, content);
}
