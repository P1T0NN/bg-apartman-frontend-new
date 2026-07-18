import { ACCOMMODATION_TYPES } from '@/shared/data/accommodationsData';

import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';

const typeLabels = new Map(ACCOMMODATION_TYPES.map((t) => [t.value, t.label]));

export function accommodationTypeLabel(type: string): string {
	return typeLabels.get(type) ?? type;
}

export function hasNightlyDiscount(acc: typesAccommodationEnriched): boolean {
	return !!acc.discountAmount && acc.discountAmount > 0 && acc.discountAmount < acc.pricePerNight;
}

/** Effective minimum nights: the accommodation's minimum, raised to 2 unless single-day stays are on. */
export function minNightsFor(
	acc: Pick<typesAccommodationEnriched, 'minReservationDays' | 'singleDayReservation'>
): number {
	return Math.max(acc.minReservationDays, acc.singleDayReservation ? 1 : 2);
}
