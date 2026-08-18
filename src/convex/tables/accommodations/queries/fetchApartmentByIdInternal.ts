// LIBRARIES
import { v } from 'convex/values';

// SERVER
import { internalQuery } from '@/convex/_generated/server';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * Unscoped single-apartment read for internal callers (actions have no `ctx.db`).
 *
 * Deliberately no ownership check — the caller (the checkout action) does the gating,
 * because what's "allowed" depends on the operation, not on the read. Never expose this
 * to the client; it exists only for `ctx.runQuery` from actions and crons.
 */
export const fetchApartmentByIdInternal = internalQuery({
	args: { id: v.id('apartments') },
	handler: async (ctx, { id }): Promise<Doc<'apartments'> | null> => {
		return await ctx.db.get(id);
	}
});
