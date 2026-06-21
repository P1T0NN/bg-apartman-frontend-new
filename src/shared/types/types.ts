/**
 * Universal result for remote commands and API-style calls (`success`, `message`, optional `data`).
 */
export type typesApiResult<TData = unknown> = {
	success: boolean;
	message: string;
	data?: TData;
};

/** One inline validation message per field key. */
export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;