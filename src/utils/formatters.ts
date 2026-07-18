// LIBRARIES
import { m } from '@/shared/lib/paraglide/messages';
import { getLocale } from '@/shared/lib/paraglide/runtime';

// UTILS
import { formatMoney } from '@/shared/utils/formatMoney';

export function formatCurrency(amount: number): string {
	return formatMoney(amount, getLocale());
}

/** Signed delta for stat-tile context lines: "+3" / "−3" / "0" (true minus sign). */
export function formatSignedCount(delta: number): string {
	const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
	return `${sign}${Math.abs(delta)}`;
}

/** Signed currency delta for stat-tile context lines: "+€120" / "−€45" / "€0". */
export function formatSignedCurrency(delta: number): string {
	const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
	return `${sign}${formatCurrency(Math.abs(delta))}`;
}

/** Format a timestamp (epoch number or ISO string) as a locale-formatted date/time. */
export function formatTs(ts: number | string): string {
	const d = new Date(ts);
	return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString(getLocale());
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
	const locale = getLocale();
	const todayMid = new Date().setHours(0, 0, 0, 0);
	const n = Math.round((Date.parse(`${iso}T00:00:00`) - todayMid) / 86_400_000);

	// ponytail: product copy for same-day check-in; Intl only gives "today"
	if (n <= 0) return 'Starts today';

	const label = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(n, 'day');
	return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "Jun 25 – Jun 28, 2026", collapsing the month when both dates share it. */
export function formatDateRange(startISO: string, endISO: string): string {
	const locale = getLocale();
	const start = new Date(startISO);
	const end = new Date(endISO);
	const sameMonth =
		start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

	const startFmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(
		start
	);

	const endFmt = new Intl.DateTimeFormat(
		locale,
		sameMonth
			? { day: 'numeric', year: 'numeric' }
			: { month: 'short', day: 'numeric', year: 'numeric' }
	).format(end);

	return `${startFmt} – ${endFmt}`;
}

/** Localized count labels — one Paraglide `CountLabels` message + one helper per unit. */
export function formatGuests(count: number): string {
	return m['CountLabels.guests']({ count });
}

export function formatBedrooms(count: number): string {
	return m['CountLabels.bedrooms']({ count });
}

export function formatBathrooms(count: number): string {
	return m['CountLabels.bathrooms']({ count });
}

export function formatChildren(count: number): string {
	return m['CountLabels.children']({ count });
}

export function formatAdults(count: number): string {
	return m['CountLabels.adults']({ count });
}

/** "2 adults · 1 child" — adults always shown; children only when > 0. */
export function formatAdultsAndChildren(adults: number, children: number): string {
	const parts = [formatAdults(adults)];
	if (children > 0) parts.push(formatChildren(children));
	return parts.join(' · ');
}

export function formatNights(count: number): string {
	return m['CountLabels.nights']({ count });
}

export function formatPlaces(count: number): string {
	return m['CountLabels.places']({ count });
}

export function formatSquareMeters(count: number): string {
	return m['CountLabels.squareMeters']({ count });
}

export function formatGuestsShort(adults: number, children: number): string {
	const total = adults + children;
	const parts = [formatGuests(total)];
	if (children > 0) parts.push(formatChildren(children));
	return parts.join(', ');
}

export function formatUpToGuests(count: number): string {
	return m['AccommodationCapacity.upToGuests']({ count });
}

export function formatMaxGuestsAllowed(count: number): string {
	return m['AccommodationCapacity.maxGuestsAllowed']({ count });
}

export function formatDaysSelected(count: number): string {
	return m['AccommodationCapacity.daysSelected']({ count });
}
