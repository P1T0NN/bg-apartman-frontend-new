// CONFIG
import { MS_PER_DAY } from '@/shared/features/booking/config';

/** Calendar-day distance from `today` (YYYY-MM-DD) to `checkIn` (YYYY-MM-DD). */
export function daysUntilCheckIn(checkInDate: string, today: string): number {
	const checkIn = Date.parse(`${checkInDate}T00:00:00Z`);
	const start = Date.parse(`${today}T00:00:00Z`);
	if (Number.isNaN(checkIn) || Number.isNaN(start)) return 0;
	return Math.floor((checkIn - start) / MS_PER_DAY);
}

/** ISO date (YYYY-MM-DD) for "today" in UTC — fine for day-granular stay rules. */
export function todayIsoUtc(now = Date.now()): string {
	return new Date(now).toISOString().slice(0, 10);
}
