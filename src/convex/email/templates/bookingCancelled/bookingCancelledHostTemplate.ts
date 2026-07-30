// SHARED
import { emailBody, stayDateFormatter } from '../shared';
import { emailHeaderTemplate } from '../header/emailHeaderTemplate';
import { emailFooterTemplate } from '../footer/emailFooterTemplate';
import { t, pickLocale } from '@/convex/i18n';

/**
 * The HOST's side of a cancellation (BookingSystemDesign.md §8's host column) — the guest
 * template next door is the guest's. Three variants, keyed by who cancelled:
 *
 *  - `guest` — "dates freed": the useful fact for the host is that the nights are open
 *    again, not that something bad happened.
 *  - `host`  — receipt of their own action, so their inbox carries the evidence trail.
 *  - `admin` — support intervened; carries the reason and invites a reply.
 */
type BookingCancelledHostData = {
	hostName: string;
	guestName: string;
	apartmentTitle: string;
	bookingCode: string;
	/** ISO `YYYY-MM-DD`. */
	checkInDate: string;
	checkOutDate: string;
	cancelReason?: string;
	cancelledBy: 'guest' | 'host' | 'admin';
	/** The host queue deep-linked to this booking (HostSystemDesign.md §6). */
	bookingUrl: string;
	/** Host's locale; unknown values fall back to `en`. */
	locale: string;
};

export function bookingCancelledHostTemplate(data: BookingCancelledHostData): {
	subject: string;
	html: string;
} {
	const locale = pickLocale(data.locale);
	const ns = 'bookingCancelledHost';
	// Keys per variant: subjectGuest/headingGuest/introGuest, subjectHost/…, subjectAdmin/…
	const variant = data.cancelledBy.charAt(0).toUpperCase() + data.cancelledBy.slice(1);

	const dateFmt = stayDateFormatter(locale);

	const params = {
		hostName: data.hostName,
		guestName: data.guestName,
		title: data.apartmentTitle,
		code: data.bookingCode
	};

	const subject = t(locale, `${ns}.subject${variant}`, { code: data.bookingCode });

	const html =
		emailHeaderTemplate(locale) +
		emailBody({
			heading: t(locale, `${ns}.heading${variant}`),
			intro: t(locale, `${ns}.intro${variant}`, params),
			rows: [
				{ label: t(locale, `${ns}.rowGuest`), value: data.guestName },
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
			cta: { label: t(locale, `${ns}.cta`), url: data.bookingUrl }
		}) +
		emailFooterTemplate(locale);

	return { subject, html };
}
