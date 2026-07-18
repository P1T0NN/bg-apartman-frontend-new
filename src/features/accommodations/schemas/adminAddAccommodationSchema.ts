// LIBRARIES
import { z } from 'zod';

// SCHEMAS
import {
	accommodationFieldsShape,
	MIN_ACCOMMODATION_PHOTOS
} from '@/features/accommodations/schemas/addAccommodationSchema';

/**
 * Admin add-accommodation form: the shared field rules plus the mandatory owner
 * (`hostId` — the better-auth user id picked in the Owner field). Same photo
 * minimum and studio-bedrooms rule as {@link addAccommodationSchema}.
 */
export const adminAddAccommodationSchema = z
	.object({
		...accommodationFieldsShape,
		hostId: z.string().min(1, 'ValidationMessages.adminAddAccommodationSchema.ownerRequired'),
		photos: z
			.array(z.unknown())
			.min(MIN_ACCOMMODATION_PHOTOS, 'ValidationMessages.addAccommodationSchema.photosMin')
	})
	.superRefine((data, ctx) => {
		// Studios are open-plan (0 separate bedrooms); every other type needs at least 1.
		if (data.type !== 'studio' && data.bedrooms < 1) {
			ctx.addIssue({
				code: 'custom',
				path: ['bedrooms'],
				message: 'ValidationMessages.accommodationFieldsShape.bedroomsRequired'
			});
		}
	});
