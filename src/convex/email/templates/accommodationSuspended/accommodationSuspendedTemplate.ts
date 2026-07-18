// SHARED
import { emailBody } from '../shared';
import { emailHeaderTemplate } from '../header/emailHeaderTemplate';
import { emailFooterTemplate } from '../footer/emailFooterTemplate';
import { t, pickLocale } from '@/convex/i18n';

/** Sent to the host when their accommodation is suspended. `manageUrl` must be absolute. */
type AccommodationSuspendedData = {
	hostName: string;
	apartmentTitle: string;
	/** Moderation reason; omitted on legacy call sites. */
	reason?: string;
	manageUrl: string;
	/** Host's locale; unknown values fall back to `en`. */
	locale: string;
};

export function accommodationSuspendedTemplate(data: AccommodationSuspendedData): {
	subject: string;
	html: string;
} {
	const locale = pickLocale(data.locale);
	const ns = 'accommodationSuspended';

	const subject = t(locale, `${ns}.subject`, { title: data.apartmentTitle });

	const html =
		emailHeaderTemplate(locale) +
		emailBody({
			heading: t(locale, `${ns}.heading`),
			intro: t(locale, `${ns}.intro`, { name: data.hostName, title: data.apartmentTitle }),
			rows: [
				{ label: t(locale, `${ns}.rowAccommodation`), value: data.apartmentTitle },
				{ label: t(locale, `${ns}.rowStatus`), value: t(locale, `${ns}.statusSuspended`) },
				...(data.reason ? [{ label: t(locale, `${ns}.rowReason`), value: data.reason }] : [])
			],
			cta: { label: t(locale, `${ns}.cta`), url: data.manageUrl }
		}) +
		emailFooterTemplate(locale);

	return { subject, html };
}
