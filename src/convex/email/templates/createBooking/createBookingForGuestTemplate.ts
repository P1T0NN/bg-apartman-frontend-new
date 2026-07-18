// SHARED
import { emailBody, stayDateFormatter } from '../shared';
import { formatMoney } from '@/shared/utils/formatMoney';
import { emailHeaderTemplate } from '../header/emailHeaderTemplate';
import { emailFooterTemplate } from '../footer/emailFooterTemplate';
import { t, pickLocale } from '@/convex/i18n';

/** Booking confirmation sent to the guest. `reservationUrl` must be absolute. */
type CreateBookingForGuestData = {
	guestFirstName: string;
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
	/** Instant-book accommodations are confirmed on creation; others start as a pending request. */
	instantBooking: boolean;
	reservationUrl: string;
	/** UI locale captured from the client; unknown values fall back to `en`. */
	locale: string;
};

export function createBookingForGuestTemplate(data: CreateBookingForGuestData): {
	subject: string;
	html: string;
} {
	const locale = pickLocale(data.locale);
	const confirmed = data.instantBooking;
	const ns = 'createBookingForGuest';

	const dateFmt = stayDateFormatter(locale);
	const total = formatMoney(data.total, locale, data.currency);
	const guests =
		data.numberOfChildren > 0
			? t(locale, `${ns}.guestsAdultsChildren`, {
					adults: data.numberOfAdults,
					children: data.numberOfChildren
				})
			: t(locale, `${ns}.guestsAdults`, { count: data.numberOfAdults });

	const subject = t(locale, confirmed ? `${ns}.subjectConfirmed` : `${ns}.subjectPending`, {
		code: data.bookingCode
	});

	const html =
		emailHeaderTemplate(locale) +
		emailBody({
			heading: t(locale, confirmed ? `${ns}.headingConfirmed` : `${ns}.headingPending`),
			intro: t(locale, confirmed ? `${ns}.introConfirmed` : `${ns}.introPending`, {
				name: data.guestFirstName,
				title: data.apartmentTitle
			}),
			code: { label: t(locale, `${ns}.confirmationCode`), value: data.bookingCode },
			rows: [
				{ label: t(locale, `${ns}.rowStay`), value: data.apartmentTitle },
				{ label: t(locale, `${ns}.rowCheckIn`), value: dateFmt.format(new Date(data.checkInDate)) },
				{
					label: t(locale, `${ns}.rowCheckOut`),
					value: dateFmt.format(new Date(data.checkOutDate))
				},
				{ label: t(locale, `${ns}.rowGuests`), value: guests },
				{ label: t(locale, `${ns}.rowTotal`), value: total }
			],
			cta: { label: t(locale, `${ns}.cta`), url: data.reservationUrl }
		}) +
		emailFooterTemplate(locale);

	return { subject, html };
}
