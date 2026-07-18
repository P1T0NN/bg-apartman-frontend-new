// LIBRARIES
import { z } from 'zod';

// SCHEMAS
import { accommodationFieldsShape, MIN_ACCOMMODATION_PHOTOS } from './addAccommodationSchema';

// Paraglide key, resolved at display time. Copy bakes in the "3" — see addAccommodationSchema note.
const MIN_PHOTOS_TOTAL_MESSAGE = 'ValidationMessages.editAccommodationSchema.photosMinTotal';

/**
 * Edit-form validation. Same field rules as {@link addAccommodationSchema}, but the
 * photo minimum counts the accommodation's *existing* kept images plus newly uploaded ones
 * (`keepImageKeys` + `photos`), so a accommodation that already has photos doesn't need 3
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
			ctx.addIssue({
				code: 'custom',
				path: ['bedrooms'],
				message: 'ValidationMessages.accommodationFieldsShape.bedroomsRequired'
			});
		}
		if (data.keepImageKeys.length + data.photos.length < MIN_ACCOMMODATION_PHOTOS) {
			ctx.addIssue({ code: 'custom', path: ['photos'], message: MIN_PHOTOS_TOTAL_MESSAGE });
			// Mirror the failure onto the existing-photos field so its grid is outlined
			// too. The empty message keeps the visible text to a single copy (under the
			// uploader) while still marking the field invalid for styling.
			ctx.addIssue({ code: 'custom', path: ['keepImageKeys'], message: '' });
		}
	});
