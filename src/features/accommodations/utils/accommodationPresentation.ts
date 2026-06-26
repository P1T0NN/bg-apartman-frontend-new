import { ACCOMMODATION_TYPES } from '@/shared/data/accommodationsData';

import type { AccommodationDetail } from '@/features/accommodations/data/accommodationDummyData';

const typeLabels = new Map(ACCOMMODATION_TYPES.map((t) => [t.value, t.label]));

export function accommodationTypeLabel(type: string): string {
	return typeLabels.get(type) ?? type;
}

export function hasNightlyDiscount(acc: AccommodationDetail): boolean {
	return !!acc.discountAmount && acc.discountAmount > 0 && acc.discountAmount < acc.pricePerNight;
}

/** Effective minimum nights: the listing's minimum, raised to 2 unless single-day stays are on. */
export function minNightsFor(acc: Pick<AccommodationDetail, 'minReservationDays' | 'singleDayReservation'>): number {
	return Math.max(acc.minReservationDays, acc.singleDayReservation ? 1 : 2);
}
