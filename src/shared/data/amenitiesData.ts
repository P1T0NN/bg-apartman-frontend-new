// LIBRARIES
import { m } from '@/shared/lib/paraglide/messages';

/** Curated amenity options rendered as toggle chips by the amenities field. */
export const AMENITIES = [
	{ id: 'wifi', label: m['Amenities.wifi']() },
	{ id: 'air_conditioning', label: m['Amenities.airConditioning']() },
	{ id: 'heating', label: m['Amenities.heating']() },
	{ id: 'kitchen', label: m['Amenities.kitchen']() },
	{ id: 'washer', label: m['Amenities.washer']() },
	{ id: 'dryer', label: m['Amenities.dryer']() },
	{ id: 'free_parking', label: m['Amenities.freeParking']() },
	{ id: 'pool', label: m['Amenities.pool']() },
	{ id: 'tv', label: m['Amenities.tv']() },
	{ id: 'workspace', label: m['Amenities.dedicatedWorkspace']() },
	{ id: 'elevator', label: m['Amenities.elevator']() },
	{ id: 'balcony', label: m['Amenities.balcony']() },
	{ id: 'dishwasher', label: m['Amenities.dishwasher']() },
	{ id: 'coffee_maker', label: m['Amenities.coffeeMaker']() },
	{ id: 'self_checkin', label: m['Amenities.selfCheckin']() },
	{ id: 'smoke_alarm', label: m['Amenities.smokeAlarm']() }
] as const;
