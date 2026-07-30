// SHARED
import { emailBody, stayDateFormatter } from '../shared';
import { emailHeaderTemplate } from '../header/emailHeaderTemplate';
import { emailFooterTemplate } from '../footer/emailFooterTemplate';
import { t, pickLocale } from '@/convex/i18n';

/**
 * Sent to the guest when a pending request ends without a host decision.
 * `browseUrl` must be absolute.
 */
type BookingAutoDeclinedData = {
	guestFirstName: string;
	apartmentTitle: string;
	bookingCode: string;
	/** ISO `YYYY-MM-DD`. */
	checkInDate: string;
	checkOutDate: string;
	browseUrl: string;
	/** Guest's locale; unknown values fall back to `en`. */
	locale: string;
	/**
	 * Why the request ended. `expired` = the 48h window ran out; `dates_taken` = the host
	 * confirmed someone else for these nights. A guest who lost a race deserves to hear
	 * that, not "you weren't answered" (BookingSystemDesign.md §6/§8).
	 */
	reason?: 'expired' | 'dates_taken';
};

export function bookingAutoDeclinedTemplate(data: BookingAutoDeclinedData): {
	subject: string;
	html: string;
} {
	const locale = pickLocale(data.locale);
	const ns = 'bookingAutoDeclined';

	const dateFmt = stayDateFormatter(locale);

	// Same layout, different explanation — the key suffix is the only thing that varies.
	const suffix = data.reason === 'dates_taken' ? 'DatesTaken' : '';

	const subject = t(locale, `${ns}.subject${suffix}`, { code: data.bookingCode });

	const html =
		emailHeaderTemplate(locale) +
		emailBody({
			heading: t(locale, `${ns}.heading${suffix}`),
			intro: t(locale, `${ns}.intro${suffix}`, {
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
				}
			],
			cta: { label: t(locale, `${ns}.cta`), url: data.browseUrl }
		}) +
		emailFooterTemplate(locale);

	return { subject, html };
}
