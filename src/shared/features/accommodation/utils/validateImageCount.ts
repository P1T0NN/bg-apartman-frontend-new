// CONFIG
import { ACCOMMODATIONS_CONFIG } from '@/shared/config';

// TYPES
import type { TranslatableMessage } from '@/shared/features/validations/types/validationsTypes';

/**
 * Server-side photo-count gate (AccommodationsSystemDesign.md §3) — enforced in the
 * mutations, not just the form: a listing with too few photos can't be submitted, because
 * guests rarely book what they can't see.
 *
 * Returns the message to reject with, or `null` when the count is fine.
 */
export function validateImageCount(count: number): TranslatableMessage | null {
	const { MIN_IMAGES, MAX_IMAGES } = ACCOMMODATIONS_CONFIG;

	if (count < MIN_IMAGES) {
		return { key: 'GenericMessages.PHOTOS_MIN_REQUIRED', params: { min: MIN_IMAGES } };
	}
	if (count > MAX_IMAGES) {
		return { key: 'GenericMessages.PHOTOS_MAX_EXCEEDED', params: { max: MAX_IMAGES } };
	}
	return null;
}
