// LIBRARIES
import { v } from 'convex/values';

export const apartmentType = v.union(
	v.literal('apartment'),
	v.literal('studio'),
	v.literal('penthouse'),
	v.literal('loft'),
	v.literal('duplex'),
	v.literal('house'),
	v.literal('villa')
);

export const apartmentStatus = v.union(
	v.literal('pending_review'),
	v.literal('published'),
	v.literal('suspended'),
	v.literal('archived')
);

/** What a guest actually chose for a booking. */
export const paymentMethod = v.union(v.literal('cash'), v.literal('online'));

/** What an apartment accepts — `both` lets the guest choose at checkout. */
export const apartmentPaymentMethod = v.union(
	v.literal('cash'),
	v.literal('online'),
	v.literal('both')
);

export const coordinates = v.object({
	lat: v.number(),
	lng: v.number()
});

/**
 * A accommodation photo stored in Cloudflare R2.
 *
 * - `key`: the R2 object key (used for deletion; the matching `uploadedFilesR2`
 *   row keeps the object alive — the orphan cron only deletes objects with no row).
 * - `url`: the permanent **public** URL (`R2_PUBLIC_BASE_URL/key`). Stored at
 *   creation so reads are free and never call `r2.getUrl` (which mints a costly,
 *   15-minute presigned URL).
 */
export const apartmentImage = v.object({
	key: v.string(),
	url: v.string(),
	alt: v.optional(v.string()),
	order: v.number()
});
