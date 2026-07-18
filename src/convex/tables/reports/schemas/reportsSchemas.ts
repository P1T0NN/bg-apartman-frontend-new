// LIBRARIES
import { v } from 'convex/values';

/** Report categories — mirrors `REPORT_CATEGORIES` in the client-side reportsSchemas.ts. */
export const reportCategory = v.union(v.literal('bug'), v.literal('idea'), v.literal('other'));
