// SEND
import { sendEmail, editAccommodationUrl, type EmailCtx } from './resend';

// TEMPLATES
import { accommodationPublishedTemplate } from './templates/accommodationPublished/accommodationPublishedTemplate';

type SendAccommodationPublishedEmailInput = {
	locale: string;
	apartmentId: string;
	hostName: string;
	hostEmail: string;
	apartmentTitle: string;
	city: string;
};

/** When an accommodation passes review: tell the host it's now live. */
export async function sendAccommodationPublishedEmail(
	ctx: EmailCtx,
	input: SendAccommodationPublishedEmailInput
): Promise<void> {
	const content = accommodationPublishedTemplate({
		locale: input.locale,
		hostName: input.hostName,
		apartmentTitle: input.apartmentTitle,
		city: input.city,
		manageUrl: editAccommodationUrl(input.apartmentId)
	});

	await sendEmail(ctx, input.hostEmail, content);
}
