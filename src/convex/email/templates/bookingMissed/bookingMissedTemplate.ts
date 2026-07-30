// SHARED
import { emailBody, stayDateFormatter } from '../shared';
import { emailHeaderTemplate } from '../header/emailHeaderTemplate';
import { emailFooterTemplate } from '../footer/emailFooterTemplate';
import { t, pickLocale } from '@/convex/i18n';

/**
 * "You missed one" — sent to the HOST when their request expired unanswered
 * (BookingSystemDesign.md §8, HostSystemDesign.md §6).
 *
 * The designed response to a host who can't keep the 48h SLA is instant booking, so the
 * copy nudges toward it (or simply faster replies) — exactly once per event, no follow-up
 * drip, and no penalty language: visibility is the lever, not punishment.
 */
type BookingMissedData = {
	hostName: string;
	guestName: string;
	apartmentTitle: string;
	bookingCode: string;
	/** ISO `YYYY-MM-DD`. */
	checkInDate: string;
	checkOutDate: string;
	/** The host queue deep-linked to this booking (HostSystemDesign.md §6). */
	bookingUrl: string;
	/** Host's locale; unknown values fall back to `en`. */
	locale: string;
};

export function bookingMissedTemplate(data: BookingMissedData): {
	subject: string;
	html: string;
} {
	const locale = pickLocale(data.locale);
	const ns = 'bookingMissed';

	const dateFmt = stayDateFormatter(locale);

	const subject = t(locale, `${ns}.subject`, { code: data.bookingCode });

	const html =
		emailHeaderTemplate(locale) +
		emailBody({
			heading: t(locale, `${ns}.heading`),
			intro: t(locale, `${ns}.intro`, {
				hostName: data.hostName,
				guestName: data.guestName,
				title: data.apartmentTitle,
				code: data.bookingCode
			}),
			rows: [
				{ label: t(locale, `${ns}.rowGuest`), value: data.guestName },
				{ label: t(locale, `${ns}.rowStay`), value: data.apartmentTitle },
				{ label: t(locale, `${ns}.rowCheckIn`), value: dateFmt.format(new Date(data.checkInDate)) },
				{
					label: t(locale, `${ns}.rowCheckOut`),
					value: dateFmt.format(new Date(data.checkOutDate))
				}
			],
			cta: { label: t(locale, `${ns}.cta`), url: data.bookingUrl }
		}) +
		emailFooterTemplate(locale);

	return { subject, html };
}
