// TYPES
import type { Doc, Id } from '@/convex/_generated/dataModel';

/**
 * Lean listing shape for the search results list + map markers (`id`/`lat`/`lng`/`title`
 * also satisfy GoogleMapMarkerData). Produced by the `fetchSearchAccommodations` query
 * from an `apartments` row.
 *
 * `rating`/`reviewCount` are optional because there is no reviews system yet — the card
 * renders "New" when they're absent. `isSuperhost` stays `false` until a host-reputation
 * concept exists.
 */
export type SearchListing = {
	id: Id<'apartments'>;
	slug: string;
	title: string;
	type: string;
	city: string;
	country: string;
	lat: number;
	lng: number;
	bedrooms: number;
	bathrooms: number;
	maxGuests: number;
	pricePerNight: number; // effective nightly — what the card and map tag show
	originalPrice?: number; // struck through when a discount applies
	rating?: number;
	reviewCount?: number;
	isSuperhost: boolean;
	image: Doc<'apartments'>['images'][number]; // cover
};
