// TYPES
import type { FieldErrors } from '../types/types';
import type { ZodIssue } from 'zod';

/**
 * Maps Zod `issues` to field keys (top path segment): first issue message wins per field.
 * Pass `includeOnlyKeys` to drop unrelated fields (e.g. scheduling vs contact when using a merged schema).
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
 * Coerce a form value into a number. `convex-mutation-form` submits the *raw*
 * field values, and every `<input>` (even `type="number"`) yields a **string** —
 * so numeric fields arrive here as strings (`""` when blank).
 */
export const num = (value: string | undefined, fallback = 0): number => {
	if (value === undefined || value.trim() === '') return fallback;
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
};

/** Optional numeric: blank → `undefined` (so the column stays unset). */
export const optNum = (value: string | undefined): number | undefined => {
	if (value === undefined || value.trim() === '') return undefined;
	const n = Number(value);
	return Number.isFinite(n) ? n : undefined;
};

/** Empty string → `undefined`, so optional text columns aren't stored as `""`. */
export const optStr = (value: string | undefined): string | undefined => {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
};
