// LIBRARIES
import { getLocalTimeZone } from '@internationalized/date';

// TYPES
import type { DateRangeLike } from '@/features/calculations/types/types';

/** Whole nights in a calendar range (check-out exclusive). 0 when incomplete. */
export function nightsInDateRange(
	range?: DateRangeLike,
	timeZone = getLocalTimeZone()
): number {
	const start = range?.start;
	const end = range?.end;
	
	if (!start || !end) return 0;

	return Math.max(0, Math.round((end.toDate(timeZone).getTime() - start.toDate(timeZone).getTime()) / 86_400_000));
}
