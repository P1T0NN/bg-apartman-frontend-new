// SHARED
import { emailBody, stayDateFormatter } from '../shared';
import { emailHeaderTemplate } from '../header/emailHeaderTemplate';
import { emailFooterTemplate } from '../footer/emailFooterTemplate';
import { t, pickLocale } from '@/convex/i18n';

/**
 * "Your listing expires in {days} days" — the T−7 nudge, `listing_fee` mode only
 * (AccommodationsSystemDesign.md §8/§10).
 *
 * Sent once per paid period, never on a timer: the sweep stamps `feeReminderSentAt` and a
 * payment clears it. The tone is a heads-up, not a threat — the listing is still live, the
 * grace window is still ahead, and renewal returns it straight to published with no
 * re-review.
 */
type ListingFeeReminderData = {
	hostName: string;
	apartmentTitle: string;
	/** Epoch ms when the paid period ends. */
	expiresAt: number;
	daysLeft: number;
	amountEuros: number;
	renewUrl: string;
	/** Host's locale; unknown values fall back to `en`. */
	locale: string;
};

export function listingFeeReminderTemplate(data: ListingFeeReminderData): {
	subject: string;
	html: string;
} {
	const locale = pickLocale(data.locale);
	const ns = 'listingFeeReminder';

	const dateFmt = stayDateFormatter(locale);
	const money = new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: 'EUR',
		maximumFractionDigits: 0
	});

	const subject = t(locale, `${ns}.subject`, { title: data.apartmentTitle });

	const html =
		emailHeaderTemplate(locale) +
		emailBody({
			heading: t(locale, `${ns}.heading`),
			intro: t(locale, `${ns}.intro`, {
				name: data.hostName,
				title: data.apartmentTitle,
				days: data.daysLeft
			}),
			rows: [
				{ label: t(locale, `${ns}.rowAccommodation`), value: data.apartmentTitle },
				{ label: t(locale, `${ns}.rowExpires`), value: dateFmt.format(new Date(data.expiresAt)) },
				{ label: t(locale, `${ns}.rowAmount`), value: money.format(data.amountEuros) }
			],
			cta: { label: t(locale, `${ns}.cta`), url: data.renewUrl }
		}) +
		emailFooterTemplate(locale);

	return { subject, html };
}
