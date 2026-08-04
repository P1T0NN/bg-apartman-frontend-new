/**
 * Universal result for remote commands and API-style calls (`success`, `message`, optional `data`).
 */
export type typesApiResult<TData = unknown> = {
	success: boolean;
	message: string;
	data?: TData;
};

// TYPES — `FieldErrors` / `TranslatableMessage` / `ZodIssueLike` are owned by the
// validations feature; import them from there, never through this module.
import type { TranslatableMessage } from '@/shared/features/validations/types/validationsTypes';

/**
 * Shared return envelope for mutations/actions across the Convex backend.
 *
 * `success: false` is a soft outcome (e.g. "nothing to do", "not found", a validation message
 * the client should surface as-is). Auth and rate-limit failures may still throw from middleware.
 *
 * `message` is always a {@link TranslatableMessage} so the client can render it in the user's
 * current locale. `data` is optional and only meaningful on success paths.
 */
export type ConvexMutationResult<Data = undefined> = {
	success: boolean;
	message: TranslatableMessage;
	data?: Data;
};

/**
 * Base shape carried by typed {@link ConvexError}s thrown anywhere in the backend. Every
 * throw site should extend this (adding its own `code` discriminator + extra metadata) so
 * clients can always feed `err.data.message` straight into `translateFromBackend`.
 *
 * @example
 * throw new ConvexError({
 *   code: 'NOT_AUTHENTICATED',
 *   message: { key: 'GenericMessages.NOT_AUTHENTICATED' }
 * } satisfies ConvexErrorPayload);
 */
export type ConvexErrorPayload = {
	code: string;
	message: TranslatableMessage;
};
