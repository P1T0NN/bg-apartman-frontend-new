// Presentation helpers for the public accommodation page: money/time/guest
// formatters, the property-type label, and amenity → icon/label mapping. Keeping
// it here means the page sections all speak the same visual language.

import { ACCOMMODATION_TYPES } from '@/shared/data/accommodationsData';
import { AMENITIES } from '@/shared/data/amenitiesData';

import type { Component } from 'svelte';
import type { AccommodationDetail } from '@/features/accommodations/data/accommodationDummyData';

// LUCIDE ICONS (amenities)
import WifiIcon from '@lucide/svelte/icons/wifi';
import SnowflakeIcon from '@lucide/svelte/icons/snowflake';
import FlameIcon from '@lucide/svelte/icons/flame';
import CookingPotIcon from '@lucide/svelte/icons/cooking-pot';
import WashingMachineIcon from '@lucide/svelte/icons/washing-machine';
import ShirtIcon from '@lucide/svelte/icons/shirt';
import CarIcon from '@lucide/svelte/icons/car';
import WavesIcon from '@lucide/svelte/icons/waves';
import TvIcon from '@lucide/svelte/icons/tv';
import LaptopIcon from '@lucide/svelte/icons/laptop';
import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
import SunIcon from '@lucide/svelte/icons/sun';
import DropletsIcon from '@lucide/svelte/icons/droplets';
import CoffeeIcon from '@lucide/svelte/icons/coffee';
import KeyRoundIcon from '@lucide/svelte/icons/key-round';
import BellRingIcon from '@lucide/svelte/icons/bell-ring';
import CheckIcon from '@lucide/svelte/icons/check';

// === FORMATTERS ==============================================================

const currencyFmt = new Intl.NumberFormat('en', {
	style: 'currency',
	currency: 'EUR',
	maximumFractionDigits: 0
});

export function formatCurrency(amount: number): string {
	return currencyFmt.format(amount);
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

export function formatGuestsShort(adults: number, children: number): string {
	const total = adults + children;
	const parts = [`${total} ${total === 1 ? 'guest' : 'guests'}`];
	if (children > 0) parts.push(`${children} ${children === 1 ? 'child' : 'children'}`);
	return parts.join(', ');
}

const typeLabels = new Map(ACCOMMODATION_TYPES.map((t) => [t.value, t.label]));

export function accommodationTypeLabel(type: string): string {
	return typeLabels.get(type) ?? type;
}

// === PRICING =================================================================

/** Nightly price actually charged (discounted price when one is set). */
export function effectiveNightly(acc: AccommodationDetail): number {
	return acc.discountAmount && acc.discountAmount > 0 ? acc.discountAmount : acc.pricePerNight;
}

export function hasNightlyDiscount(acc: AccommodationDetail): boolean {
	return !!acc.discountAmount && acc.discountAmount > 0 && acc.discountAmount < acc.pricePerNight;
}

/** Whole nights between two ISO dates (check-out exclusive). 0 when either is missing. */
export function nightsBetween(startISO?: string | null, endISO?: string | null): number {
	if (!startISO || !endISO) return 0;
	const start = new Date(startISO).getTime();
	const end = new Date(endISO).getTime();
	if (Number.isNaN(start) || Number.isNaN(end)) return 0;
	return Math.max(0, Math.round((end - start) / 86_400_000));
}

export type PriceQuote = {
	nightly: number;
	nights: number;
	accommodationTotal: number;
	cleaningFee: number;
	total: number;
};

/** Single source of truth for the price breakdown shown on the listing and at checkout. */
export function priceQuote(acc: AccommodationDetail, nights: number): PriceQuote {
	const nightly = effectiveNightly(acc);
	const cleaningFee = acc.cleaningFee ?? 0;
	const accommodationTotal = nightly * nights;
	return { nightly, nights, accommodationTotal, cleaningFee, total: accommodationTotal + cleaningFee };
}

// === DATE DISPLAY ============================================================

/** "Thu, Jun 25, 2026" */
export function formatDateMedium(value: string | number): string {
	return new Intl.DateTimeFormat('en', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	}).format(new Date(value));
}

/** "Jun 25 – Jun 28, 2026", collapsing the month when both dates share it. */
export function formatDateRange(startISO: string, endISO: string): string {
	const start = new Date(startISO);
	const end = new Date(endISO);
	const sameMonth =
		start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
	const startFmt = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(start);
	const endFmt = new Intl.DateTimeFormat(
		'en',
		sameMonth
			? { day: 'numeric', year: 'numeric' }
			: { month: 'short', day: 'numeric', year: 'numeric' }
	).format(end);
	return `${startFmt} – ${endFmt}`;
}

// === AMENITIES ===============================================================

const amenityLabels = new Map<string, string>(AMENITIES.map((a) => [a.id, a.label]));

export function amenityLabel(id: string): string {
	return amenityLabels.get(id) ?? id;
}

const AMENITY_ICONS: Record<string, Component> = {
	wifi: WifiIcon,
	air_conditioning: SnowflakeIcon,
	heating: FlameIcon,
	kitchen: CookingPotIcon,
	washer: WashingMachineIcon,
	dryer: ShirtIcon,
	free_parking: CarIcon,
	pool: WavesIcon,
	tv: TvIcon,
	workspace: LaptopIcon,
	elevator: ArrowUpDownIcon,
	balcony: SunIcon,
	dishwasher: DropletsIcon,
	coffee_maker: CoffeeIcon,
	self_checkin: KeyRoundIcon,
	smoke_alarm: BellRingIcon
};

export function amenityIcon(id: string): Component {
	return AMENITY_ICONS[id] ?? CheckIcon;
}
