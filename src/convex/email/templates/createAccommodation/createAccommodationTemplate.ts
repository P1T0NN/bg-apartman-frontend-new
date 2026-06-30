// SHARED
import { emailBody } from '../shared';
import { emailHeaderTemplate } from '../header/emailHeaderTemplate';
import { emailFooterTemplate } from '../footer/emailFooterTemplate';
import { t, pickLocale } from '@/convex/i18n';

/** "Listing created" email sent to the host. `manageUrl` must be absolute. */
type CreateAccommodationData = {
	hostName: string;
	apartmentTitle: string;
	city: string;
	/** Published immediately vs. awaiting review/approval. */
	live: boolean;
	manageUrl: string;
	/** Host's locale; unknown values fall back to `en`. */
	locale: string;
};

export function createAccommodationTemplate(data: CreateAccommodationData): {
	subject: string;
	html: string;
} {
	const locale = pickLocale(data.locale);
	const live = data.live;
	const ns = 'createAccommodation';

	const subject = t(locale, live ? `${ns}.subjectLive` : `${ns}.subjectPending`, { title: data.apartmentTitle });

	const html =
		emailHeaderTemplate(locale) +
		emailBody({
			heading: t(locale, live ? `${ns}.headingLive` : `${ns}.headingReview`),
			intro: t(locale, live ? `${ns}.introLive` : `${ns}.introReview`, {
				name: data.hostName,
				title: data.apartmentTitle
			}),
			rows: [
				{ label: t(locale, `${ns}.rowListing`), value: data.apartmentTitle },
				{ label: t(locale, `${ns}.rowLocation`), value: data.city },
				{ label: t(locale, `${ns}.rowStatus`), value: t(locale, live ? `${ns}.statusPublished` : `${ns}.statusInReview`) }
			],
			cta: { label: t(locale, `${ns}.cta`), url: data.manageUrl }
		}) +
		emailFooterTemplate(locale);

	return { subject, html };
}
