// Wires the validations feature into zod. Dual-runtime, but each runtime must opt in.

// LIBRARIES
import { z } from 'zod';

// UTILS
import { mapDefaultValidationErrors } from '../utils/mapDefaultValidationErrors.js';

/**
 * Install the map as zod's global default. Call once per runtime at startup — the Svelte
 * side does it in `src/hooks.ts` (universal, so SSR and browser both get it). Convex
 * mutations that `.safeParse` a shared schema get zod's English defaults unless they call
 * this too; that is deliberate — their messages are never shown, the client re-validates
 * and renders codes.
 *
 * Idempotent: a hot reload or a second call is harmless.
 */
export function applyDefaultValidationMessages(): void {
	z.config({ customError: mapDefaultValidationErrors });
}
