// TYPES
import type { FieldErrors } from '../types/types';
import type { ZodIssue } from 'zod';

/**
 * Maps Zod `issues` to field keys (top path segment): first issue message wins per field.
 * Pass `includeOnlyKeys` to drop unrelated fields (e.g. scheduling vs contact when using a
 * merged schema).
 *
 * `issue.message` is already human copy: the shared schemas carry no messages at all, and
 * the global error map (`src/utils/zodMessages.ts`, installed once at app boot)
 * turns each violation into a sentence. Nothing is translated here — that seam moved into
 * the error map, which is the one place copy for schema failures lives.
 */
export function zodIssuesToFieldErrors<T extends string>(
	issues: readonly ZodIssue[],
	includeOnlyKeys?: readonly T[]
): FieldErrors<T> {
	const out: FieldErrors<T> = {};
	for (const issue of issues) {
		const key = issue.path[0];
		if (
			typeof key !== 'string' ||
			(includeOnlyKeys !== undefined && !(includeOnlyKeys as readonly string[]).includes(key))
		) {
			continue;
		}
		if (!(key in out)) {
			(out as Record<string, string>)[key] = issue.message;
		}
	}
	return out;
}

/**
 * Per-row errors for one item of an array field, keyed by the item's own property name
 * (`issues` with path `[arrayKey, index, prop]`). For array editors rendered outside the
 * declared fields — {@link zodIssuesToFieldErrors} collapses those to the array key alone,
 * which can't say WHICH row failed.
 *
 * @example
 * ```ts
 * const errors = zodIssuesForArrayItem(issues, 'images', i); // { key: '…', url: '…' }
 * ```
 */
export function zodIssuesForArrayItem(
	issues: readonly ZodIssue[],
	arrayKey: string,
	index: number
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const issue of issues) {
		const [key, itemIndex, prop] = issue.path;
		if (key !== arrayKey || itemIndex !== index || typeof prop !== 'string') continue;
		if (!(prop in out)) out[prop] = issue.message;
	}
	return out;
}
