// SHARED
import { emailBody, stayDateFormatter } from '../shared';
import { emailHeaderTemplate } from '../header/emailHeaderTemplate';
import { emailFooterTemplate } from '../footer/emailFooterTemplate';
import { t, pickLocale } from '@/convex/i18n';

/**
 * "Guest confirmed" — the closing FYI to the HOST after the guest's one-click confirm
 * (BookingSystemDesign.md §11). `reservationsUrl` must be absolute.
 */
type StayConfirmedData = {
	hostName: string;
	guestName: string;
	apartmentTitle: string;
	bookingCode: string;
	/** ISO `YYYY-MM-DD`. */
	checkInDate: string;
	reservationsUrl: string;
	/** Host's locale; unknown values fall back to `en`. */
	locale: string;
};

export function stayConfirmedTemplate(data: StayConfirmedData): {
	subject: string;
	html: string;
} {
	const locale = pickLocale(data.locale);
	const ns = 'stayConfirmed';

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
				{ label: t(locale, `${ns}.rowCheckIn`), value: dateFmt.format(new Date(data.checkInDate)) }
			],
			cta: { label: t(locale, `${ns}.cta`), url: data.reservationsUrl }
		}) +
		emailFooterTemplate(locale);

	return { subject, html };
}
