/**
 * One slide in a generic image gallery — the minimal shape any image source can
 * satisfy. `typesAccommodationImage` (apartments.images) is structurally
 * assignable, so the gallery is reusable for photos, booking confirmations, etc.
 */
export type ImageGalleryImage = {
	key: string;
	url: string;
	alt?: string;
};
