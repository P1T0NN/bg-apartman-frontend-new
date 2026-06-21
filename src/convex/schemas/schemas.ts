// LIBRARIES
import { v, type Infer } from 'convex/values';

/**
 * Result envelope consumed by `convex-mutation-form` → `translateFromBackend`.
 * `success: true` toasts `message` as success; `false` toasts it as an error.
 */
export const createResult = v.object({
	success: v.boolean(),
	message: v.object({ key: v.string() })
});

export type CreateResult = Infer<typeof createResult>;
