// CONFIG
import { MS_PER_DAY } from '@/shared/config';

/**
 * How many of a stay's nights fall inside the half-open window `[startMs, endMs)`.
 *
 * The occupancy primitive: a stay that straddles a month boundary contributes only the
 * nights actually inside the window, so summing across listings can never exceed the days
 * available. Returns 0 for an unparseable or non-overlapping stay rather than throwing —
 * callers are aggregating, and one bad row must not take out the whole dashboard.
 *
 * Distinct from its two siblings, which is why it has its own name:
 *   - `nightsBetween(a, b)`     → total nights of a stay, unclipped.
 *   - `nightsInRange(a, b)`     → the night DATES as ISO strings.
 *   - `nightsWithinWindow(...)` → a COUNT clipped to an arbitrary ms window (this one).
 */
export function nightsWithinWindow(
	checkIn: string,
	checkOut: string,
	startMs: number,
	endMs: number
): number {
	const ci = Date.parse(`${checkIn}T00:00:00Z`);
	const co = Date.parse(`${checkOut}T00:00:00Z`);
	if (Number.isNaN(ci) || Number.isNaN(co)) return 0;

	return Math.max(0, (Math.min(co, endMs) - Math.max(ci, startMs)) / MS_PER_DAY);
}
