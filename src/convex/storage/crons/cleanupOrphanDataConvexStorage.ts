// LIBRARIES
import { v } from 'convex/values';

// UTILS
import { internalMutation } from '../../functions.js';
import { internal } from '../../_generated/api';

// CONFIG
import { STORAGE_CLEANUP_DATA } from '@/shared/config';

/**
 * Bidirectional cleanup between Convex file storage (`_storage`) and the
 * `uploadedFiles` table. Mirrors {@link cleanupOrphanDataR2} for the Convex-storage backend.
 *
 *   - Blob deleted from the dashboard → row points at nothing → we delete the row.
 *   - Row deleted from the dashboard → orphaned blob in `_storage` → we delete the blob.
 *
 * **Any-scale design (TODO.md #2):** each direction pages its own side in
 * `STORAGE_CLEANUP_DATA.BATCH`-sized transactions and checks the counterpart PER ITEM with
 * an indexed point lookup (`ctx.db.system.get` / `by_storage_id`), self-scheduling the next
 * batch until done. The old "a sweep may only delete against a COMPLETE opposite snapshot"
 * constraint dissolves entirely: "has no counterpart" is decided per item inside one
 * transaction, so truncation ambiguity cannot exist. Orphans younger than
 * `STORAGE_CLEANUP_DATA.GRACE_MS` are left alone — an in-flight upload has a blob before it
 * has a row.
 *
 * **IMPORTANT assumption:** `uploadedFiles` is the *only* user table in this project that
 * references `_storage`. The blob → row direction deletes any sufficiently old `_storage`
 * entry with no matching row — if you add another table that stores `Id<'_storage'>`
 * (avatars, attachments, generated reports, etc.) you MUST extend the reference check
 * below, or narrow the sweep to one direction. Otherwise this will silently nuke files
 * other features depend on.
 *
 * Overlapping chains (a cron firing while a previous chain still runs) only duplicate
 * work: conflicting transactions re-execute, re-read their page, and find the row already
 * gone — never a double delete.
 */
export const cleanupOrphanDataConvexStorage = internalMutation({
	args: {
		phase: v.optional(v.union(v.literal('rows'), v.literal('blobs'))),
		cursor: v.optional(v.string()),
		staleRows: v.optional(v.number()),
		staleBlobs: v.optional(v.number())
	},
	handler: async (ctx, args) => {
		const phase = args.phase ?? 'rows';
		let staleRows = args.staleRows ?? 0;
		let staleBlobs = args.staleBlobs ?? 0;
		const self =
			internal.storage.crons.cleanupOrphanDataConvexStorage.cleanupOrphanDataConvexStorage;

		// ── Phase 1: rows whose blob is gone ────────────────────────────────────
		if (phase === 'rows') {
			const { page, isDone, continueCursor } = await ctx.db
				.query('uploadedFiles')
				.paginate({ numItems: STORAGE_CLEANUP_DATA.BATCH, cursor: args.cursor ?? null });

			for (const row of page) {
				if ((await ctx.db.system.get(row.storageId)) === null) {
					await ctx.db.delete(row._id);
					staleRows++;
				}
			}

			await ctx.scheduler.runAfter(
				0,
				self,
				isDone
					? { phase: 'blobs', staleRows, staleBlobs }
					: { phase: 'rows', cursor: continueCursor, staleRows, staleBlobs }
			);
			return { phase, examined: page.length, staleRows, staleBlobs, done: false };
		}

		// ── Phase 2: blobs no row references ────────────────────────────────────
		const { page, isDone, continueCursor } = await ctx.db.system
			.query('_storage')
			.paginate({ numItems: STORAGE_CLEANUP_DATA.BATCH, cursor: args.cursor ?? null });

		const cutoff = Date.now() - STORAGE_CLEANUP_DATA.GRACE_MS;
		for (const blob of page) {
			if (blob._creationTime > cutoff) continue; // possibly an in-flight upload
			const ref = await ctx.db
				.query('uploadedFiles')
				.withIndex('by_storage_id', (q) => q.eq('storageId', blob._id))
				.first();
			if (ref === null) {
				await ctx.storage.delete(blob._id);
				staleBlobs++;
			}
		}

		if (!isDone) {
			await ctx.scheduler.runAfter(0, self, {
				phase: 'blobs',
				cursor: continueCursor,
				staleRows,
				staleBlobs
			});
			return { phase, examined: page.length, staleRows, staleBlobs, done: false };
		}

		if (staleRows || staleBlobs) {
			console.warn('[cleanupOrphanDataConvexStorage] cleaned orphans', {
				staleRows,
				staleBlobs
			});
		}
		return { phase, examined: page.length, staleRows, staleBlobs, done: true };
	}
});
