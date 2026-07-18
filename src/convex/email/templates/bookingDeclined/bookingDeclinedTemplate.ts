// SHARED
import { emailBody, stayDateFormatter } from '../shared';
import { emailHeaderTemplate } from '../header/emailHeaderTemplate';
import { emailFooterTemplate } from '../footer/emailFooterTemplate';
import { t, pickLocale } from '@/convex/i18n';

/** Sent to the guest when a host declines their pending request. `browseUrl` must be absolute. */
type BookingDeclinedData = {
	guestFirstName: string;
	apartmentTitle: string;
	bookingCode: string;
	/** The host's mandatory decline reason (already trimmed). */
	declineReason: string;
	/** ISO `YYYY-MM-DD`. */
	checkInDate: string;
	checkOutDate: string;
	browseUrl: string;
	/** Guest's locale; unknown values fall back to `en`. */
	locale: string;
};

export function bookingDeclinedTemplate(data: BookingDeclinedData): {
	subject: string;
	html: string;
} {
	const locale = pickLocale(data.locale);
	const ns = 'bookingDeclined';

	const dateFmt = stayDateFormatter(locale);

	const subject = t(locale, `${ns}.subject`, { code: data.bookingCode });

	const html =
		emailHeaderTemplate(locale) +
		emailBody({
			heading: t(locale, `${ns}.heading`),
			intro: t(locale, `${ns}.intro`, {
				name: data.guestFirstName,
				title: data.apartmentTitle,
				code: data.bookingCode
			}),
			rows: [
				{ label: t(locale, `${ns}.rowStay`), value: data.apartmentTitle },
				{ label: t(locale, `${ns}.rowCheckIn`), value: dateFmt.format(new Date(data.checkInDate)) },
				{
					label: t(locale, `${ns}.rowCheckOut`),
					value: dateFmt.format(new Date(data.checkOutDate))
				},
				{ label: t(locale, `${ns}.rowReason`), value: data.declineReason }
			],
			cta: { label: t(locale, `${ns}.cta`), url: data.browseUrl }
		}) +
		emailFooterTemplate(locale);

	return { subject, html };
}
