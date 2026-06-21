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
