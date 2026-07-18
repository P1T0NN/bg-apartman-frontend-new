// UTILS
import { effectiveNightlyPrice } from '@/shared/features/pricing/utils/calculatePrice';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { SearchAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';

/**
 * Map a published apartment row to the lean search card/marker shape.
 * Caller must guarantee coordinates and at least one photo.
 */
export function apartmentToSearchAccommodation(apartment: Doc<'apartments'>): SearchAccommodation {
	const cover = apartment.images[0];

	const nightly = effectiveNightlyPrice(apartment);

	return {
		id: apartment._id,
		slug: apartment.slug,
		title: apartment.title,
		type: apartment.type,
		city: apartment.city,
		country: apartment.country ?? '',
		lat: apartment.coordinates!.lat,
		lng: apartment.coordinates!.lng,
		bedrooms: apartment.bedrooms,
		bathrooms: apartment.bathrooms,
		maxGuests: apartment.maxGuests,
		pricePerNight: nightly,
		originalPrice: nightly < apartment.pricePerNight ? apartment.pricePerNight : undefined,
		isSuperhost: apartment.isSuperhost ?? false, // denormalized from the host at create
		image: cover
		// rating / reviewCount omitted — no reviews system yet (card shows "New")
	};
}
