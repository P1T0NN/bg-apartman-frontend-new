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

/** UTC start-of-month timestamp `offset` months before the month containing `now`. */
export function monthStartUtc(now: number, offset: number): number {
	const d = new Date(now);
	return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - offset, 1);
}

/** Whole nights between two ISO dates (check-out exclusive). 0 when either is missing. */
export function nightsBetween(startISO?: string | null, endISO?: string | null): number {
	if (!startISO || !endISO) return 0;
	const start = new Date(startISO).getTime();
	const end = new Date(endISO).getTime();
	if (Number.isNaN(start) || Number.isNaN(end)) return 0;

	return Math.max(0, Math.round((end - start) / 86_400_000));
}
