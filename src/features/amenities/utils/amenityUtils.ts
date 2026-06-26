// DATA
import { AMENITIES, AMENITY_ICONS } from '../data/amenitiesData';

// TYPES
import type { Component } from 'svelte';

// LUCIDE ICONS
import CheckIcon from '@lucide/svelte/icons/check';

const amenityLabels = new Map<string, string>(AMENITIES.map((a) => [a.id, a.label]));

export function amenityLabel(id: string): string {
	return amenityLabels.get(id) ?? id;
}

export function amenityIcon(id: string): Component {
	return AMENITY_ICONS[id] ?? CheckIcon;
}
