// LIBRARIES
import { sendEmail, editAccommodationUrl, type EmailCtx } from './resend';

// TEMPLATES
import { accommodationSuspendedTemplate } from './templates/accommodationSuspended/accommodationSuspendedTemplate';

type SendAccommodationSuspendedEmailInput = {
	locale: string;
	apartmentId: string;
	hostName: string;
	hostEmail: string;
	apartmentTitle: string;
};

/** When an accommodation is suspended: tell the host it's no longer visible. */
export async function sendAccommodationSuspendedEmail(
	ctx: EmailCtx,
	input: SendAccommodationSuspendedEmailInput
): Promise<void> {
	const content = accommodationSuspendedTemplate({
		locale: input.locale,
		hostName: input.hostName,
		apartmentTitle: input.apartmentTitle,
		manageUrl: editAccommodationUrl(input.apartmentId)
	});

	await sendEmail(ctx, input.hostEmail, content);
}
