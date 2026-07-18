// SEND
import { sendEmail, editAccommodationUrl, type EmailCtx } from './resend';

// TEMPLATES
import { createAccommodationTemplate } from './templates/createAccommodation/createAccommodationTemplate';

type SendCreateAccommodationEmailInput = {
	locale: string;
	apartmentId: string;
	hostName: string;
	hostEmail: string;
	apartmentTitle: string;
	city: string;
	/** Published immediately vs. awaiting review. */
	live: boolean;
};

/** On a new accommodation: tell the host it's live (or in review). */
export async function sendCreateAccommodationEmail(
	ctx: EmailCtx,
	input: SendCreateAccommodationEmailInput
): Promise<void> {
	const content = createAccommodationTemplate({
		locale: input.locale,
		hostName: input.hostName,
		apartmentTitle: input.apartmentTitle,
		city: input.city,
		live: input.live,
		manageUrl: editAccommodationUrl(input.apartmentId)
	});

	await sendEmail(ctx, input.hostEmail, content);
}
