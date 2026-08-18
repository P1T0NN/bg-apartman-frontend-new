// CONFIG
import { ACCOMMODATIONS_CONFIG } from '@/shared/config';

// SEND
import { sendEmail, myAccommodationsUrl, type EmailCtx } from './resend';

// TEMPLATES
import { listingFeeRefundedTemplate } from './templates/listingFee/listingFeeRefundedTemplate';

type SendListingFeeRefundedEmailInput = {
	locale: string;
	hostName: string;
	hostEmail: string;
	apartmentTitle: string;
};

/** An admin refunded the listing fee: the listing is back to pending review, re-pay to go live. */
export async function sendListingFeeRefundedEmail(
	ctx: EmailCtx,
	input: SendListingFeeRefundedEmailInput
): Promise<void> {
	const content = listingFeeRefundedTemplate({
		locale: input.locale,
		hostName: input.hostName,
		apartmentTitle: input.apartmentTitle,
		amountEuros: ACCOMMODATIONS_CONFIG.LISTING_FEE.AMOUNT,
		renewUrl: myAccommodationsUrl()
	});

	await sendEmail(ctx, input.hostEmail, content);
}
