// LIBRARIES
import { m } from '@/shared/lib/paraglide/messages';

const currencyFmt = new Intl.NumberFormat('en', {
	style: 'currency',
	currency: 'EUR',
	maximumFractionDigits: 0
});

export function formatCurrency(amount: number): string {
	return currencyFmt.format(amount);
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

export function formatDays(count: number): string {
	return m['CountLabels.days']({ count });
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

export function formatNightsSelected(count: number): string {
	return m['AccommodationCapacity.nightsSelected']({ count });
}

export function formatDaysSelected(count: number): string {
	return m['AccommodationCapacity.daysSelected']({ count });
}
