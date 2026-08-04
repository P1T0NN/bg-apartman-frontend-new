// CONFIG
import { applyDefaultValidationMessages } from '@/shared/features/validations/config/validationsConfig';

// TYPES
import type { Transport } from '@sveltejs/kit';

// The shared zod schemas carry NO messages — they are bundled into Convex, which must never
// hold display copy. This installs the CODE-emitting default error map once per runtime, at
// module load. `hooks.ts` is universal, so SSR and the browser both get it before any form
// parses. Idempotent, so HMR re-running the module is harmless.
applyDefaultValidationMessages();

export const transport = {} satisfies Transport;
