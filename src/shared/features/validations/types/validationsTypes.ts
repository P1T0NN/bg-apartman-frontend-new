// Single source of truth for every type the validations feature exposes — dual-runtime
// (imported by Convex and Svelte alike), so nothing here may reference Svelte or the DOM.

/** One inline validation message per field key — the shape every form renders from. */
export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

/**
 * Locale-agnostic message descriptor: a catalog key + its interpolation params.
 * The backend (and zod's default error map) emit these; ONLY the frontend turns them into
 * words. `params` must match the template's placeholders and stay JSON-serialisable.
 *
 * @example
 * // Backend:
 * return { success: true, message: { key: 'GenericMessages.DATA_TABLE_DELETED_ALL', params: { count: 3 } } };
 * // Frontend (see `translateFromBackend`):
 * toast.success(translateFromBackend(result.message));
 */
export type TranslatableMessage = {
	key: string;
	params?: Record<string, string | number | boolean>;
};

/**
 * The slice of a zod issue this feature reads. Structural on purpose: zod v4 deprecated
 * the `ZodIssue` name, and `path` + `message` is the entire dependency — any
 * `error.issues` array satisfies it across zod versions.
 */
export type ZodIssueLike = { path: ReadonlyArray<PropertyKey>; message: string };
