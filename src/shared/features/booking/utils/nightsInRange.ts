// CONFIG
import { MS_PER_DAY } from '@/shared/config';

/**
 * Every night in the half-open range `[startDate, endDate)` as ISO `YYYY-MM-DD`.
 *
 * Same convention as {@link nightRangesOverlap}: the end date is the checkout day, so it
 * is NOT one of the nights. `['2026-06-10', '2026-06-13')` → 10th, 11th, 12th.
 *
 * Returns `[]` for an empty or inverted range rather than throwing — callers validate the
 * range themselves and this keeps them branch-free.
 */
export function nightsInRange(startDate: string, endDate: string): string[] {
	const start = Date.parse(`${startDate}T00:00:00Z`);
	const end = Date.parse(`${endDate}T00:00:00Z`);
	if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return [];

	const nights: string[] = [];
	for (let ms = start; ms < end; ms += MS_PER_DAY) {
		nights.push(new Date(ms).toISOString().slice(0, 10));
	}
	return nights;
}
