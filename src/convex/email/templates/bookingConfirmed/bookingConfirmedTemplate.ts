// SHARED
import { emailBody, stayDateFormatter } from '../shared';
import { formatMoney } from '@/shared/utils/formatMoney';
import { emailHeaderTemplate } from '../header/emailHeaderTemplate';
import { emailFooterTemplate } from '../footer/emailFooterTemplate';
import { t, pickLocale } from '@/convex/i18n';

/** Sent to the guest when a previously pending booking is confirmed. `reservationUrl` absolute. */
type BookingConfirmedData = {
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
	reservationUrl: string;
	/** Guest's locale; unknown values fall back to `en`. */
	locale: string;
};

export function bookingConfirmedTemplate(data: BookingConfirmedData): {
	subject: string;
	html: string;
} {
	const locale = pickLocale(data.locale);
	const ns = 'bookingConfirmed';

	const dateFmt = stayDateFormatter(locale);
	const total = formatMoney(data.total, locale, data.currency);
	const guests =
		data.numberOfChildren > 0
			? t(locale, `${ns}.guestsAdultsChildren`, {
					adults: data.numberOfAdults,
					children: data.numberOfChildren
				})
			: t(locale, `${ns}.guestsAdults`, { count: data.numberOfAdults });

	const subject = t(locale, `${ns}.subject`, { code: data.bookingCode });

	const html =
		emailHeaderTemplate(locale) +
		emailBody({
			heading: t(locale, `${ns}.heading`),
			intro: t(locale, `${ns}.intro`, { name: data.guestFirstName, title: data.apartmentTitle }),
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
