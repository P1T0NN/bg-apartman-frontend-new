// Search-results fixtures. Derived from the single canonical listing
// (accommodationDummyData) by scattering it across Belgrade neighbourhoods with
// varied prices, covers and ratings — enough rows to exercise the map +
// infinite scroll. Deterministic (seeded) so SSR and client render identically.
//
// ponytail: every card links back to the one real detail record; swap
// `searchListings` for a Convex `fetchOptimized` cursor query when the
// `apartments` table is wired — the page already consumes a plain array.

import { accommodationDummyData, type AccommodationImage } from './accommodationDummyData';

import type { Id } from '@/convex/_generated/dataModel';

/** Lean card/marker shape. `id`/`lat`/`lng`/`title` also satisfy GoogleMapMarkerData. */
export type SearchListing = {
	id: Id<'apartments'>;
	slug: string;
	title: string;
	type: string;
	city: string;
	lat: number;
	lng: number;
	bedrooms: number;
	bathrooms: number;
	maxGuests: number;
	pricePerNight: number; // effective nightly — what the card and map tag show
	originalPrice?: number; // struck through when a discount applies
	rating: number;
	reviewCount: number;
	isSuperhost: boolean;
	image: AccommodationImage; // cover
};

const BELGRADE = { lat: 44.8155, lng: 20.4612 };

const NEIGHBORHOODS = [
	'Skadarlija', 'Stari Grad', 'Vračar', 'Dorćol', 'Savamala',
	'Zemun', 'Voždovac', 'Senjak', 'Kalemegdan', 'Banovo Brdo'
];
const ADJECTIVES = ['Sunlit', 'Cozy', 'Modern', 'Bright', 'Charming', 'Quiet', 'Elegant', 'Designer', 'Riverside', 'Central'];
const NOUNS = ['Loft', 'Apartment', 'Studio', 'Flat', 'Retreat', 'Hideaway', 'Residence', 'Nook'];
const TYPES = ['apartment', 'studio', 'loft', 'penthouse', 'apartment', 'duplex'];

// mulberry32 — tiny deterministic PRNG so the fixture set is stable per index
// (no Math.random → no SSR/client hydration drift).
function rng(seed: number) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const pick = <T>(arr: readonly T[], r: number): T => arr[Math.floor(r * arr.length)];

const COUNT = 42;
const images = accommodationDummyData.images;

export const searchListings: SearchListing[] = Array.from({ length: COUNT }, (_, i) => {
	const r = rng(i + 1);
	const neighborhood = NEIGHBORHOODS[i % NEIGHBORHOODS.length];
	const bedrooms = 1 + Math.floor(r() * 3);
	const base = 45 + Math.round(r() * 130); // €45–€175
	const discounted = r() < 0.35;

	return {
		id: `apt_${i + 1}` as Id<'apartments'>,
		slug: accommodationDummyData.slug,
		title: `${pick(ADJECTIVES, r())} ${neighborhood} ${pick(NOUNS, r())}`,
		type: pick(TYPES, r()),
		city: 'Belgrade',
		// Scatter ~±4km N/S and ~±5km E/W of the centre.
		lat: BELGRADE.lat + (r() - 0.5) * 0.07,
		lng: BELGRADE.lng + (r() - 0.5) * 0.11,
		bedrooms,
		bathrooms: 1 + Math.floor(r() * 2),
		maxGuests: bedrooms * 2,
		pricePerNight: discounted ? Math.round(base * 0.85) : base,
		originalPrice: discounted ? base : undefined,
		rating: Math.round((4.5 + r() * 0.5) * 100) / 100,
		reviewCount: 12 + Math.floor(r() * 240),
		isSuperhost: r() < 0.4,
		image: images[i % images.length]
	};
});
