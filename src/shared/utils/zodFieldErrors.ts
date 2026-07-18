// UTILS
import { translateFromBackend } from '@/utils/translateFromBackend';

// TYPES
import type { FieldErrors } from '../types/types';
import type { ZodIssue } from 'zod';

/**
 * Maps Zod `issues` to field keys (top path segment): first issue message wins per field.
 * Pass `includeOnlyKeys` to drop unrelated fields (e.g. scheduling vs contact when using a merged schema).
 *
 * Each issue's `message` is treated as a **Paraglide message key** and resolved through
 * {@link translateFromBackend} at *display* time — so schemas stay pure (no `m` import, safe to
 * share with Convex) and messages track the ambient locale reactively. Plain-string messages that
 * aren't keys fall back to themselves, so legacy literal messages keep working during migration.
 *
 * Client-only: this pulls in the Paraglide catalog. Keep it out of Convex-reachable modules
 * (that's why it lives here and not in `validationUtils`, which Convex mutations import).
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
			(out as Record<string, string>)[key] = translateFromBackend(issue.message);
		}
	}
	return out;
}
