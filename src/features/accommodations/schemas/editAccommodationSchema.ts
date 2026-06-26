// LIBRARIES
import { z } from 'zod';

// SCHEMAS
import { accommodationFieldsShape, MIN_ACCOMMODATION_PHOTOS } from './addAccommodationSchema';

const MIN_PHOTOS_TOTAL_MESSAGE = `Keep or add at least ${MIN_ACCOMMODATION_PHOTOS} photos in total.`;

/**
 * Edit-form validation. Same field rules as {@link addAccommodationSchema}, but the
 * photo minimum counts the listing's *existing* kept images plus newly uploaded ones
 * (`keepImageKeys` + `photos`), so a listing that already has photos doesn't need 3
 * brand-new uploads. The error is attached to `photos` so it surfaces on the uploader.
 */
export const editAccommodationSchema = z
	.object({
		...accommodationFieldsShape,
		keepImageKeys: z.array(z.string()),
		photos: z.array(z.unknown())
	})
	.superRefine((data, ctx) => {
		if (data.type !== 'studio' && data.bedrooms < 1) {
			ctx.addIssue({ code: 'custom', path: ['bedrooms'], message: 'At least one bedroom.' });
		}
		if (data.keepImageKeys.length + data.photos.length < MIN_ACCOMMODATION_PHOTOS) {
			ctx.addIssue({ code: 'custom', path: ['photos'], message: MIN_PHOTOS_TOTAL_MESSAGE });
			// Mirror the failure onto the existing-photos field so its grid is outlined
			// too. The empty message keeps the visible text to a single copy (under the
			// uploader) while still marking the field invalid for styling.
			ctx.addIssue({ code: 'custom', path: ['keepImageKeys'], message: '' });
		}
	});
