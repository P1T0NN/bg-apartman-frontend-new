// Zod's default error strings ("Invalid input: expected string, received undefined"),
// rewritten as human, UX-grade messages — emitted as translation CODES from
// `validationsData.ts`, never text. Dual-runtime: zod is isolate-safe, so Convex and
// Svelte share this map; only the frontend turns codes into words.
//
// Installed globally by `config/validationsConfig.ts`. Precedence is zod's: a per-field
// message on a schema always wins, so this only replaces the raw zod defaults.
//
// Resolution order inside the map:
//   1. the KEY a `.refine`/`.superRefine` passed in `params` (cross-field rules that no
//      issue code can express — `ACCOMMODATION_ISSUE`, `BOOKING_ISSUE`, `AUTH_ISSUE`),
//   2. bespoke copy registered for the field path,
//   3. a generic code for the violation.

// CONFIG
import {
	VALIDATION_FIELD_MESSAGE_KEYS,
	VALIDATION_MESSAGE_KEYS as KEY
} from '../data/validationsData.js';

/** Bare key when there's nothing to interpolate; `parseTranslatableMessage` reads the rest. */
function code(key: string, params?: Record<string, string | number | boolean>): string {
	return params ? JSON.stringify({ key, params }) : key;
}

function asNumber(value: unknown): number {
	return typeof value === 'bigint' ? Number(value) : (value as number);
}

/** Generic code for a violation, ignoring path and refinement keys. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function genericCode(issue: any): string | undefined {
	switch (issue.code) {
		case 'invalid_type': {
			// The classic "field left empty" — zod reports it as a type error on undefined.
			if (issue.input === undefined || issue.input === null) return code(KEY.required);
			if (issue.expected === 'number') return code(KEY.notANumber);
			if (issue.expected === 'date') return code(KEY.invalidDate);
			return code(KEY.invalidValue);
		}
		case 'too_small': {
			const min = asNumber(issue.minimum);
			if (issue.origin === 'string') {
				// `.min(1)` is "required" in intent, not "at least 1 character".
				return min <= 1 ? code(KEY.required) : code(KEY.textTooShort, { min });
			}
			if (issue.origin === 'number' || issue.origin === 'int' || issue.origin === 'bigint') {
				return min === 0 && issue.inclusive
					? code(KEY.numberNotNegative)
					: code(KEY.numberTooSmall, { min });
			}
			if (issue.origin === 'array' || issue.origin === 'set') {
				return code(KEY.tooFewItems, { min });
			}
			return undefined;
		}
		case 'too_big': {
			const max = asNumber(issue.maximum);
			if (issue.origin === 'string') return code(KEY.textTooLong, { max });
			if (issue.origin === 'number' || issue.origin === 'int' || issue.origin === 'bigint') {
				return code(KEY.numberTooBig, { max });
			}
			if (issue.origin === 'array' || issue.origin === 'set') {
				return code(KEY.tooManyItems, { max });
			}
			return undefined;
		}
		case 'invalid_format': {
			if (issue.format === 'email') return code(KEY.invalidEmail);
			if (issue.format === 'url') return code(KEY.invalidUrl);
			return code(KEY.invalidValue);
		}
		// Wrong literal / enum member — selects, radio groups, discriminators.
		case 'invalid_value':
		case 'invalid_union':
			return code(KEY.invalidChoice);
		default:
			return undefined;
	}
}

/**
 * Zod v4 `customError` map. Returns a code (or serialized `{ key, params }`) for the
 * issues users actually hit in forms; returns `undefined` for exotic issues so zod's own
 * default still applies rather than us mistranslating something rare.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDefaultValidationErrors(issue: any): string | undefined {
	// 1. Refinement keys travel as `params: { key }`, NOT as `message` — zod skips this map
	//    entirely for any issue that already carries an explicit `message`, so a schema
	//    using `message` for its key would leak the raw key straight into the UI.
	//    Anything else in `params` becomes the message's interpolation params.
	const refinement = issue?.params as Record<string, unknown> | undefined;
	if (refinement && typeof refinement.key === 'string') {
		const { key, ...params } = refinement;
		return code(key, Object.keys(params).length ? (params as never) : undefined);
	}

	// 2. Bespoke copy for the field path (full dotted path first, then the leaf).
	const path: unknown[] = Array.isArray(issue?.path) ? issue.path : [];
	const dotted = path.join('.');
	const leaf = String(path.at(-1) ?? '');
	const byPath = VALIDATION_FIELD_MESSAGE_KEYS[dotted] ?? VALIDATION_FIELD_MESSAGE_KEYS[leaf];
	if (byPath) return byPath;

	// 3. Generic violation code.
	return genericCode(issue);
}
