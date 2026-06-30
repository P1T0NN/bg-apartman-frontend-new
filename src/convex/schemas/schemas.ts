// LIBRARIES
import { v, type GenericValidator, type Infer } from 'convex/values';

/**
 * Locale-agnostic message descriptor returned by mutations/actions.
 * The frontend resolves `key` (+ optional `params`) via Paraglide.
 */
export const translatableMessage = v.object({
	key: v.string(),
	params: v.optional(
		v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
	)
});

export type TranslatableMessage = Infer<typeof translatableMessage>;

/**
 * Standard mutation envelope — `success: true` toasts `message` as success;
 * `success: false` toasts it as an error. No `data` on message-only mutations.
 */
export const mutationResult = v.object({
	success: v.boolean(),
	message: translatableMessage
});

export type MutationResult = Infer<typeof mutationResult>;

/** Mutation envelope with optional typed `data` (meaningful on success paths). */
export function mutationResultData<T extends GenericValidator>(data: T) {
	return v.object({
		success: v.boolean(),
		message: translatableMessage,
		data: v.optional(data)
	});
}
