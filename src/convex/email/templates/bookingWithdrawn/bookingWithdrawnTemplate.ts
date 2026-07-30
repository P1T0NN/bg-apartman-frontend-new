// SHARED
import { emailBody, stayDateFormatter } from '../shared';
import { emailHeaderTemplate } from '../header/emailHeaderTemplate';
import { emailFooterTemplate } from '../footer/emailFooterTemplate';
import { t, pickLocale } from '@/convex/i18n';

/**
 * Polite FYI to the HOST when a guest withdraws a pending request
 * (BookingSystemDesign.md §8). Deliberately unexcited copy: a withdrawal is a non-event —
 * nothing was reserved, nothing changes — and the email must not read like a loss.
 * `reservationsUrl` must be absolute.
 */
type BookingWithdrawnData = {
	hostName: string;
	guestName: string;
	apartmentTitle: string;
	bookingCode: string;
	/** ISO `YYYY-MM-DD`. */
	checkInDate: string;
	checkOutDate: string;
	reservationsUrl: string;
	/** Host's locale; unknown values fall back to `en`. */
	locale: string;
};

export function bookingWithdrawnTemplate(data: BookingWithdrawnData): {
	subject: string;
	html: string;
} {
	const locale = pickLocale(data.locale);
	const ns = 'bookingWithdrawn';

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
			cta: { label: t(locale, `${ns}.cta`), url: data.reservationsUrl }
		}) +
		emailFooterTemplate(locale);

	return { subject, html };
}
