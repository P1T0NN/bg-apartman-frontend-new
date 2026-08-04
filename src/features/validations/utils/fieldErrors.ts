// Svelte-side field errors: the dual-runtime mappers localized for display, plus the
// UI-only helper for clearing an error while the user retypes.

// HELPERS
import {
	zodIssuesToFieldErrorCodes,
	zodIssuesForArrayItemCodes
} from '@/shared/features/validations/utils/zodFieldErrors';
import { translateValidationMessage } from './translateFromBackend';

// TYPES
import type {
	FieldErrors,
	ZodIssueLike
} from '@/shared/features/validations/types/validationsTypes';

/**
 * Maps zod `issues` to per-field messages, localized for display — serialized descriptors
 * from the default error map, bare catalog keys, and bespoke human strings all come out
 * as rendered text. First issue per top-level field wins.
 */
export function zodIssuesToFieldErrors<T extends string>(
	issues: readonly ZodIssueLike[],
	includeOnlyKeys?: readonly T[]
): FieldErrors<T> {
	const out: FieldErrors<T> = {};
	for (const [key, message] of Object.entries(
		zodIssuesToFieldErrorCodes(issues, includeOnlyKeys)
	)) {
		out[key as T] = translateValidationMessage(message as string);
	}
	return out;
}

/**
 * Per-row errors for one item of an array field, localized. For array editors rendered
 * outside the declared fields — {@link zodIssuesToFieldErrors} collapses those to the array
 * key alone, which can't say WHICH row failed.
 *
 * @example
 * ```ts
 * const errors = zodIssuesForArrayItem(issues, 'photos', i); // { key: '…', url: '…' }
 * ```
 */
export function zodIssuesForArrayItem(
	issues: readonly ZodIssueLike[],
	arrayKey: string,
	index: number
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [prop, message] of Object.entries(
		zodIssuesForArrayItemCodes(issues, arrayKey, index)
	)) {
		out[prop] = translateValidationMessage(message);
	}
	return out;
}

/**
 * Returns an `oninput`/`onchange` handler that clears `key`'s error on any reactive
 * container exposing `fieldErrors` (a `$state` field, or a class with getter/setter).
 * Reassigns an immutable copy so both proxy state and accessor-backed state react.
 *
 * @example
 * ```svelte
 * oninput={clearFieldErrorOn(contactSectionClass, 'name')}
 * ```
 */
export function clearFieldErrorOn<T extends string>(
	context: { fieldErrors: FieldErrors<T> },
	key: T
): () => void {
	return () => {
		if (!(key in context.fieldErrors)) return;
		const next = { ...context.fieldErrors };
		delete next[key];
		context.fieldErrors = next;
	};
}
