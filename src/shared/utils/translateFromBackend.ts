// LIBRARIES
import { m } from '@/shared/lib/paraglide/messages';

/**
 * Locale-agnostic message descriptor emitted by the backend (Convex mutations/actions).
 *
 * Deliberately redeclared here rather than imported from `@/convex/*` — the frontend utils
 * must not depend on the Convex runtime. TypeScript is structural, so any Convex return value
 * shaped like this is accepted by {@link translateFromBackend} with no casting.
 *
 * Keep this definition in sync with `ConvexMutationResult['message']` on the backend.
 */
export type TranslatableMessage = {
	/** Paraglide message key, e.g. `"GenericMessages.DATA_TABLE_DELETED_ALL"`. */
	key: string;
	/** Serialisable interpolation params; must match the template placeholders. */
	params?: Record<string, string | number | boolean>;
};

/**
 * Minimal lookup shape over the Paraglide catalog. We intentionally cast `m` to this instead
 * of typing every known key — the catalog is huge, generated, and the backend only emits
 * `string` keys anyway. Unknown keys fall back to the key literal (visible in dev), which is
 * exactly what you want for missing-translation debugging.
 */
type ParaglideMessageFn = (params?: Record<string, string | number | boolean>) => string;
type ParaglideCatalog = Record<string, ParaglideMessageFn>;

/**
 * Resolve a backend-issued {@link TranslatableMessage} in the frontend's current locale.
 *
 * Single lookup + single call — no reactive state, no overhead. Safe to call from event
 * handlers, render blocks, etc.
 *
 * @example
 * const result = await safeMutation(client, api.foo.bar, args);
 * if (result) toast[result.success ? 'success' : 'error'](translateFromBackend(result.message));
 */
export function translateFromBackend(
	message: TranslatableMessage | string
): string {
	const descriptor: TranslatableMessage =
		typeof message === 'string' ? { key: message } : message;
	const fn = (m as unknown as ParaglideCatalog)[descriptor.key];
	return fn ? fn(descriptor.params) : descriptor.key;
}

/**
 * Structural type guard for `ConvexError.data` payloads that carry a {@link TranslatableMessage}.
 * True for any object with a `message: { key: string; params?: ... }` — the code discriminator
 * and extra metadata our backend errors attach are ignored.
 *
 * Used by `safeMutation` / `safeAction` to auto-translate backend errors; exported for any
 * call site that wants to branch on it manually (e.g. show a dialog instead of a toast).
 */
export function hasTranslatableMessage(
	data: unknown
): data is { message: TranslatableMessage } {
	if (typeof data !== 'object' || data === null || !('message' in data)) return false;
	const msg = (data as { message: unknown }).message;
	return (
		typeof msg === 'object' &&
		msg !== null &&
		typeof (msg as { key?: unknown }).key === 'string'
	);
}
