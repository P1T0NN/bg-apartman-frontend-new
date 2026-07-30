// CONFIG
import { BOOKING_POLICY, MS_PER_DAY } from '@/shared/config';

/** Calendar-day distance from `today` (YYYY-MM-DD) to `checkIn` (YYYY-MM-DD). */
export function daysUntilCheckIn(checkInDate: string, today: string): number {
	const checkIn = Date.parse(`${checkInDate}T00:00:00Z`);
	const start = Date.parse(`${today}T00:00:00Z`);
	if (Number.isNaN(checkIn) || Number.isNaN(start)) return 0;
	return Math.floor((checkIn - start) / MS_PER_DAY);
}

/** ISO date (YYYY-MM-DD) for "today" in UTC. Prefer {@link todayInPropertyZone} for stay rules. */
export function todayIsoUtc(now = Date.now()): string {
	return new Date(now).toISOString().slice(0, 10);
}

/** ISO date (YYYY-MM-DD) for "today" in an IANA zone. */
export function todayIsoInZone(timeZone: string, now = Date.now()): string {
	// `en-CA` formats as YYYY-MM-DD, but assemble from parts so a locale/ICU quirk can never
	// silently reorder the components.
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(new Date(now));

	const get = (type: 'year' | 'month' | 'day') => parts.find((p) => p.type === type)?.value ?? '';
	return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * "Today" as every booking transition measures it (BookingSystemDesign.md §3).
 *
 * Stay dates carry no time component, so the day boundary must be the property's, not the
 * server's UTC day (a 23:00 UTC run is already tomorrow in Belgrade) and not the viewer's
 * — otherwise a guest abroad and the cron would disagree about whether a cancellation is
 * late.
 */
export function todayInPropertyZone(now = Date.now()): string {
	return todayIsoInZone(BOOKING_POLICY.PROPERTY_TIMEZONE, now);
}
