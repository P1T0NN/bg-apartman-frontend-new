// SHARED
import { emailBody } from '../shared';
import { emailHeaderTemplate } from '../header/emailHeaderTemplate';
import { emailFooterTemplate } from '../footer/emailFooterTemplate';
import { t, pickLocale } from '@/convex/i18n';

/**
 * "Your listing is no longer visible" — sent at the moment the sweep flips
 * `published` → `expired` (AccommodationsSystemDesign.md §8/§10).
 *
 * Two facts the copy must carry, because both are true and both are reassuring:
 *  - existing confirmed stays are unaffected; only NEW bookings are blocked (§11's first
 *    row — `expired` is a bookability gate, not a cancellation);
 *  - renewing puts it straight back live with no re-review (§1), so the road back is one
 *    click and the email carries it.
 *
 * Billing is not moderation: nothing here should read like a suspension.
 */
type ListingFeeLapsedData = {
	hostName: string;
	apartmentTitle: string;
	amountEuros: number;
	renewUrl: string;
	/** Host's locale; unknown values fall back to `en`. */
	locale: string;
};

export function listingFeeLapsedTemplate(data: ListingFeeLapsedData): {
	subject: string;
	html: string;
} {
	const locale = pickLocale(data.locale);
	const ns = 'listingFeeLapsed';

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
			intro: t(locale, `${ns}.intro`, { name: data.hostName, title: data.apartmentTitle }),
			rows: [
				{ label: t(locale, `${ns}.rowAccommodation`), value: data.apartmentTitle },
				{ label: t(locale, `${ns}.rowStatus`), value: t(locale, `${ns}.statusExpired`) },
				{ label: t(locale, `${ns}.rowAmount`), value: money.format(data.amountEuros) }
			],
			cta: { label: t(locale, `${ns}.cta`), url: data.renewUrl }
		}) +
		emailFooterTemplate(locale);

	return { subject, html };
}
