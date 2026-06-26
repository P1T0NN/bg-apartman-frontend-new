// HELPERS
import { createDeleteMutation } from '@/convex/helpers/createDeleteMutation';
import { deleteApartmentImageKeys } from '../helpers/deleteApartmentImages';

/**
 * Owner-scoped delete for an apartment listing. Ownership via `hostId` IS the auth
 * rule (the factory auto-disables its admin gate when `ownerId` is supplied). Phase 1
 * removes the listing's R2 photos + their `uploadedFilesR2` rows before the row itself
 * is deleted.
 */
export const deleteApartment = createDeleteMutation('deleteApartment', {
	table: 'apartments',
	ownerId: { field: (doc) => doc.hostId },
	runStorageDelete: (ctx, docs) =>
		deleteApartmentImageKeys(
			ctx,
			docs.flatMap((doc) => doc.images.map((image) => image.key))
		)
});
