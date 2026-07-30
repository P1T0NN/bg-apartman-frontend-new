// LIBRARIES
import { v } from 'convex/values';

/** Report categories — mirrors `REPORT_CATEGORIES` in the client-side reportsSchemas.ts. */
export const reportCategory = v.union(v.literal('bug'), v.literal('idea'), v.literal('other'));

/**
 * Where a report stands in the admin inbox (AdminPagesSystemDesign.md §4).
 *
 * Optional on the table: `undefined` means `'new'`, so rows filed before this field
 * existed need no migration. Readers MUST normalize with `?? 'new'` — the aggregate
 * namespace does, and `listReportsSafe` reads both the `undefined` and `'new'` index
 * slices for the same reason. New rows always stamp it explicitly.
 */
export const reportStatus = v.union(v.literal('new'), v.literal('resolved'));
