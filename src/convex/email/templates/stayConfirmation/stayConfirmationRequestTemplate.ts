// SHARED
import { emailBody, stayDateFormatter } from '../shared';
import { emailHeaderTemplate } from '../header/emailHeaderTemplate';
import { emailFooterTemplate } from '../footer/emailFooterTemplate';
import { t, pickLocale } from '@/convex/i18n';

/**
 * "Please confirm your stay" — sent to the GUEST when the host requests confirmation
 * (BookingSystemDesign.md §11). The CTA is the reservation link, where the live page shows
 * the one-click confirm. Friendly by design: this is a normal pre-stay check, not a threat.
 * `reservationUrl` must be absolute.
 */
type StayConfirmationRequestData = {
	guestFirstName: string;
	hostName: string;
	apartmentTitle: string;
	bookingCode: string;
	/** ISO `YYYY-MM-DD`. */
	checkInDate: string;
	checkOutDate: string;
	reservationUrl: string;
	/** Guest's locale; unknown values fall back to `en`. */
	locale: string;
};

export function stayConfirmationRequestTemplate(data: StayConfirmationRequestData): {
	subject: string;
	html: string;
} {
	const locale = pickLocale(data.locale);
	const ns = 'stayConfirmationRequest';

	const dateFmt = stayDateFormatter(locale);

	const subject = t(locale, `${ns}.subject`, { code: data.bookingCode });

	const html =
		emailHeaderTemplate(locale) +
		emailBody({
			heading: t(locale, `${ns}.heading`),
			intro: t(locale, `${ns}.intro`, {
				name: data.guestFirstName,
				hostName: data.hostName,
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
			cta: { label: t(locale, `${ns}.cta`), url: data.reservationUrl }
		}) +
		emailFooterTemplate(locale);

	return { subject, html };
}
