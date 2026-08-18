// SHARED
import { emailBody } from '../shared';
import { emailHeaderTemplate } from '../header/emailHeaderTemplate';
import { emailFooterTemplate } from '../footer/emailFooterTemplate';
import { t, pickLocale } from '@/convex/i18n';

/**
 * "Your listing fee was refunded" — sent by `resetListingAfterRefund` when an admin
 * refunds the fee (StripeTODO §8c). Mirror of the lapsed email: the listing is no longer
 * bookable, existing stays go ahead, and the road back is one payment with no re-review.
 * The tone is financial (money moved back), not punitive.
 */
type ListingFeeRefundedData = {
	hostName: string;
	apartmentTitle: string;
	amountEuros: number;
	renewUrl: string;
	/** Host's locale; unknown values fall back to `en`. */
	locale: string;
};

export function listingFeeRefundedTemplate(data: ListingFeeRefundedData): {
	subject: string;
	html: string;
} {
	const locale = pickLocale(data.locale);
	const ns = 'listingFeeRefunded';

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
				amount: money.format(data.amountEuros)
			}),
			rows: [
				{ label: t(locale, `${ns}.rowAccommodation`), value: data.apartmentTitle },
				{ label: t(locale, `${ns}.rowStatus`), value: t(locale, `${ns}.statusRefunded`) },
				{ label: t(locale, `${ns}.rowAmount`), value: money.format(data.amountEuros) }
			],
			cta: { label: t(locale, `${ns}.cta`), url: data.renewUrl }
		}) +
		emailFooterTemplate(locale);

	return { subject, html };
}
