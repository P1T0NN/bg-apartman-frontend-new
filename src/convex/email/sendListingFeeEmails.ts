// CONFIG
import { ACCOMMODATIONS_CONFIG } from '@/shared/config';

// SEND
import { sendEmail, myAccommodationsUrl, type EmailCtx } from './resend';

// TEMPLATES
import { listingFeeReminderTemplate } from './templates/listingFee/listingFeeReminderTemplate';
import { listingFeeLapsedTemplate } from './templates/listingFee/listingFeeLapsedTemplate';

type ListingFeeEmailBase = {
	locale: string;
	hostName: string;
	hostEmail: string;
	apartmentTitle: string;
};

/**
 * Both listing-fee emails (AccommodationsSystemDesign.md §10), sent only by the sweep and
 * only in `listing_fee` mode. Their CTA is the `my-accommodations` list, where the renewal
 * state lives — billing is per listing, so the host lands on the row, not on a dashboard
 * (HostSystemDesign.md §5.2).
 */

/** T−7: the paid period is running out, the listing is still live. */
export async function sendListingFeeReminderEmail(
	ctx: EmailCtx,
	input: ListingFeeEmailBase & { expiresAt: number; daysLeft: number }
): Promise<void> {
	const content = listingFeeReminderTemplate({
		locale: input.locale,
		hostName: input.hostName,
		apartmentTitle: input.apartmentTitle,
		expiresAt: input.expiresAt,
		daysLeft: input.daysLeft,
		amountEuros: ACCOMMODATIONS_CONFIG.LISTING_FEE.AMOUNT,
		renewUrl: myAccommodationsUrl()
	});

	await sendEmail(ctx, input.hostEmail, content);
}

/** At the flip: the listing has gone `expired` and is no longer bookable. */
export async function sendListingFeeLapsedEmail(
	ctx: EmailCtx,
	input: ListingFeeEmailBase
): Promise<void> {
	const content = listingFeeLapsedTemplate({
		locale: input.locale,
		hostName: input.hostName,
		apartmentTitle: input.apartmentTitle,
		amountEuros: ACCOMMODATIONS_CONFIG.LISTING_FEE.AMOUNT,
		renewUrl: myAccommodationsUrl()
	});

	await sendEmail(ctx, input.hostEmail, content);
}
