// LIBRARIES
import { getLocale } from '@/shared/lib/paraglide/runtime';

/** Format a timestamp (epoch number or ISO string) as a locale-formatted date/time. */
export function formatTs(ts: number | string): string {
	const d = new Date(ts);
	return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

/** "15:00" → "3:00 PM". Falls back to the raw value if it can't be parsed. */
export function formatTime12(time: string): string {
	const [hStr, mStr] = time.split(':');
	const h = Number(hStr);
	const m = Number(mStr);
	if (Number.isNaN(h) || Number.isNaN(m)) return time;
	const period = h < 12 ? 'AM' : 'PM';
	const hour12 = h % 12 === 0 ? 12 : h % 12;
	
	return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/** Whole nights between two ISO dates (check-out exclusive). 0 when either is missing. */
export function nightsBetween(startISO?: string | null, endISO?: string | null): number {
	if (!startISO || !endISO) return 0;
	const start = new Date(startISO).getTime();
	const end = new Date(endISO).getTime();
	if (Number.isNaN(start) || Number.isNaN(end)) return 0;

	return Math.max(0, Math.round((end - start) / 86_400_000));
}

/** "Jun 25, 2026" — used where the year matters. */
export function formatDate(value: string | number): string {
	return new Intl.DateTimeFormat(getLocale(), {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	}).format(new Date(value));
}

/** "Jun 25" — compact form for dense table cells. */
export function formatDateShort(value: string | number): string {
	return new Intl.DateTimeFormat(getLocale(), {
		month: 'short',
		day: 'numeric'
	}).format(new Date(value));
}

/** Weekday + date, e.g. "Thu, Jun 25" — used in stay timelines. */
export function formatDateWithWeekday(value: string | number): string {
	return new Intl.DateTimeFormat(getLocale(), {
		weekday: 'short',
		month: 'short',
		day: 'numeric'
	}).format(new Date(value));
}

/** "Starts today", "Tomorrow", "In 3 days" — calendar days until an ISO date. */
export function countdownLabel(iso: string): string {
	const todayMid = new Date().setHours(0, 0, 0, 0);
	const n = Math.round((Date.parse(`${iso}T00:00:00`) - todayMid) / 86_400_000);
	
	// ponytail: product copy for same-day check-in; Intl only gives "today"
	if (n <= 0) return 'Starts today';

	const label = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' }).format(n, 'day');
	return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "Jun 25 – Jun 28, 2026", collapsing the month when both dates share it. */
export function formatDateRange(startISO: string, endISO: string): string {
	const locale = getLocale();

	const start = new Date(startISO);
	const end = new Date(endISO);
	const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

	const startFmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(start);

	const endFmt = new Intl.DateTimeFormat(locale, sameMonth
		? { day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' }
	).format(end);

	return `${startFmt} – ${endFmt}`;
}
