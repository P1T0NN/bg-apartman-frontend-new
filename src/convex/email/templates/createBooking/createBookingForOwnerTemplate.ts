// SHARED
import { emailBody } from '../shared';
import { emailHeaderTemplate } from '../header/emailHeaderTemplate';
import { emailFooterTemplate } from '../footer/emailFooterTemplate';
import { t, pickLocale } from '@/convex/i18n';

/** New-booking notification sent to the apartment owner. `bookingUrl` must be absolute. */
type CreateBookingForOwnerData = {
	hostName: string;
	guestName: string;
	guestEmail: string;
	guestPhone: string;
	apartmentTitle: string;
	bookingCode: string;
	/** ISO `YYYY-MM-DD`. */
	checkInDate: string;
	checkOutDate: string;
	numberOfAdults: number;
	numberOfChildren: number;
	total: number;
	/** ISO currency code, e.g. `EUR`. */
	currency: string;
	/** Instant-book → already confirmed; otherwise a request awaiting the host's action. */
	instantBooking: boolean;
	bookingUrl: string;
	/** Owner's locale; unknown values fall back to `en`. */
	locale: string;
};

export function createBookingForOwnerTemplate(data: CreateBookingForOwnerData): {
	subject: string;
	html: string;
} {
	const locale = pickLocale(data.locale);
	const confirmed = data.instantBooking;
	const ns = 'createBookingForOwner';

	const dateFmt = new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
	const total = new Intl.NumberFormat(locale, { style: 'currency', currency: data.currency, maximumFractionDigits: 0 }).format(data.total);
	const guests =
		data.numberOfChildren > 0
			? t(locale, `${ns}.guestsAdultsChildren`, { adults: data.numberOfAdults, children: data.numberOfChildren })
			: t(locale, `${ns}.guestsAdults`, { count: data.numberOfAdults });

	const subject = t(locale, confirmed ? `${ns}.subjectConfirmed` : `${ns}.subjectPending`, { code: data.bookingCode });

	const html =
		emailHeaderTemplate(locale) +
		emailBody({
			heading: t(locale, confirmed ? `${ns}.headingConfirmed` : `${ns}.headingPending`),
			intro: t(locale, confirmed ? `${ns}.introConfirmed` : `${ns}.introPending`, {
				hostName: data.hostName,
				guestName: data.guestName,
				title: data.apartmentTitle
			}),
			rows: [
				{ label: t(locale, `${ns}.rowGuest`), value: data.guestName },
				{ label: t(locale, `${ns}.rowContact`), value: `${data.guestEmail} · ${data.guestPhone}` },
				{ label: t(locale, `${ns}.rowStay`), value: data.apartmentTitle },
				{ label: t(locale, `${ns}.rowCheckIn`), value: dateFmt.format(new Date(data.checkInDate)) },
				{ label: t(locale, `${ns}.rowCheckOut`), value: dateFmt.format(new Date(data.checkOutDate)) },
				{ label: t(locale, `${ns}.rowGuests`), value: guests },
				{ label: t(locale, `${ns}.rowTotal`), value: total }
			],
			cta: { label: t(locale, `${ns}.cta`), url: data.bookingUrl }
		}) +
		emailFooterTemplate(locale);

	return { subject, html };
}
