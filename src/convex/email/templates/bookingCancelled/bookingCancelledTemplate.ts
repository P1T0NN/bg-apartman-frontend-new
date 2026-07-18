// SHARED
import { emailBody, stayDateFormatter } from '../shared';
import { emailHeaderTemplate } from '../header/emailHeaderTemplate';
import { emailFooterTemplate } from '../footer/emailFooterTemplate';
import { t, pickLocale } from '@/convex/i18n';

/** Sent to the guest when a booking is cancelled. `browseUrl` must be absolute. */
type BookingCancelledData = {
	guestFirstName: string;
	apartmentTitle: string;
	bookingCode: string;
	/** ISO `YYYY-MM-DD`. */
	checkInDate: string;
	checkOutDate: string;
	/** Cancellation reason; omitted on legacy call sites. */
	cancelReason?: string;
	browseUrl: string;
	/** Guest's locale; unknown values fall back to `en`. */
	locale: string;
};

export function bookingCancelledTemplate(data: BookingCancelledData): {
	subject: string;
	html: string;
} {
	const locale = pickLocale(data.locale);
	const ns = 'bookingCancelled';

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
				...(data.cancelReason
					? [{ label: t(locale, `${ns}.rowReason`), value: data.cancelReason }]
					: [])
			],
			cta: { label: t(locale, `${ns}.cta`), url: data.browseUrl }
		}) +
		emailFooterTemplate(locale);

	return { subject, html };
}
