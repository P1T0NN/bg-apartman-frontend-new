// LIBRARIES
import { ConvexError } from 'convex/values';

// HELPERS
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';

// TYPES
import type { QueryCtx, MutationCtx, ActionCtx } from '@/convex/_generated/server';
import type { ConvexErrorPayload } from '@/shared/types/types';

/**
 * {@link getAuthUserId} for call sites that cannot proceed anonymously — throws the typed
 * `NOT_AUTHENTICATED` error the client already routes through `translateFromBackend`
 * instead of returning `null`.
 */
export const requireAuthUserId = async (
	ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<string> => {
	const userId = await getAuthUserId(ctx);
	if (!userId) {
		throw new ConvexError({
			code: 'NOT_AUTHENTICATED',
			message: { key: 'GenericMessages.NOT_AUTHENTICATED' }
		} satisfies ConvexErrorPayload);
	}
	return userId;
};
