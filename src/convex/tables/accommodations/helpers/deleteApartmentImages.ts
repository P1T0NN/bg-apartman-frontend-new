// R2
import { r2 } from '@/convex/storage/r2/r2';

// TYPES
import type { MutationCtx } from '@/convex/_generated/server';

/**
 * Remove a set of apartment image R2 objects and their `uploadedFilesR2` rows.
 *
 * Dedupes keys, drops the owning row (so the orphan cron has nothing left to
 * chase) and deletes the R2 object. Used by the update mutation (photos the host
 * removed) and the delete mutation (all of a listing's photos, flat-mapped from
 * the deleted docs).
 */
export async function deleteApartmentImageKeys(ctx: MutationCtx, keys: string[]): Promise<void> {
	for (const key of [...new Set(keys)]) {
		const row = await ctx.db
			.query('uploadedFilesR2')
			.withIndex('by_key', (q) => q.eq('key', key))
			.unique();
		if (row) await ctx.db.delete(row._id);
		await r2.deleteObject(ctx, key);
	}
}
