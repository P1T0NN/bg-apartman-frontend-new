// CONFIG
import { BACKEND_MESSAGES } from './messages';

// TYPES
import type { TranslatableMessage } from '@/shared/types/types';

/**
 * Resolve a backend-issued {@link TranslatableMessage} to display text.
 *
 * The backend never returns prose — only `{ key, params? }` — so this is the single seam where
 * a key becomes words. Unknown keys fall back to the key literal, which is exactly what you
 * want for spotting a missing entry in dev.
 *
 * Single lookup + a placeholder pass — no reactive state, no overhead. Safe to call from event
 * handlers, render blocks, etc.
 *
 * @example
 * const result = await safeMutation(client, api.foo.bar, args);
 * if (result) toast[result.success ? 'success' : 'error'](translateFromBackend(result.message));
 */
export function translateFromBackend(message: TranslatableMessage | string): string {
	const descriptor: TranslatableMessage = typeof message === 'string' ? { key: message } : message;
	const text = BACKEND_MESSAGES[descriptor.key];
	if (text === undefined) return descriptor.key;

	const params = descriptor.params;
	if (!params) return text;
	return text.replace(/\{(\w+)\}/g, (whole, name: string) =>
		name in params ? String(params[name]) : whole
	);
}

/**
 * Structural type guard for `ConvexError.data` payloads that carry a {@link TranslatableMessage}.
 * True for any object with a `message: { key: string; params?: ... }` — the code discriminator
 * and extra metadata our backend errors attach are ignored.
 *
 * Used by `safeMutation` / `safeAction` to auto-translate backend errors; exported for any
 * call site that wants to branch on it manually (e.g. show a dialog instead of a toast).
 */
export function hasTranslatableMessage(data: unknown): data is { message: TranslatableMessage } {
	if (typeof data !== 'object' || data === null || !('message' in data)) return false;
	const msg = (data as { message: unknown }).message;
	return (
		typeof msg === 'object' && msg !== null && typeof (msg as { key?: unknown }).key === 'string'
	);
}
