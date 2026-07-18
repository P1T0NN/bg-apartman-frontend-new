// SHARED
import { emailBody } from '../shared';
import { emailHeaderTemplate } from '../header/emailHeaderTemplate';
import { emailFooterTemplate } from '../footer/emailFooterTemplate';
import { t, pickLocale } from '@/convex/i18n';

/** Sent to the host when their accommodation passes review and goes live. `manageUrl` absolute. */
type AccommodationPublishedData = {
	hostName: string;
	apartmentTitle: string;
	city: string;
	manageUrl: string;
	/** Host's locale; unknown values fall back to `en`. */
	locale: string;
};

export function accommodationPublishedTemplate(data: AccommodationPublishedData): {
	subject: string;
	html: string;
} {
	const locale = pickLocale(data.locale);
	const ns = 'accommodationPublished';

	const subject = t(locale, `${ns}.subject`, { title: data.apartmentTitle });

	const html =
		emailHeaderTemplate(locale) +
		emailBody({
			heading: t(locale, `${ns}.heading`),
			intro: t(locale, `${ns}.intro`, { name: data.hostName, title: data.apartmentTitle }),
			rows: [
				{ label: t(locale, `${ns}.rowAccommodation`), value: data.apartmentTitle },
				{ label: t(locale, `${ns}.rowLocation`), value: data.city },
				{ label: t(locale, `${ns}.rowStatus`), value: t(locale, `${ns}.statusPublished`) }
			],
			cta: { label: t(locale, `${ns}.cta`), url: data.manageUrl }
		}) +
		emailFooterTemplate(locale);

	return { subject, html };
}
