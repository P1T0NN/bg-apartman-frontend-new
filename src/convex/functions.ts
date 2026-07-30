// LIBRARIES
import { Triggers } from 'convex-helpers/server/triggers';
import { customCtx, customMutation } from 'convex-helpers/server/customFunctions';

// UTILS
import {
	mutation as rawMutation,
	internalMutation as rawInternalMutation
} from '@/convex/_generated/server';
import { aggregateReports, aggregateApartments, aggregateHostEarnings } from '@/convex/aggregates';

// TYPES
import type { DataModel } from '@/convex/_generated/dataModel';

/**
 * Trigger-wrapped mutation constructors — the single choke point that keeps the
 * table-count aggregates (`@/convex/aggregates`) in sync with every insert / patch /
 * replace / delete on the aggregated tables.
 *
 * RULE: import `mutation` / `internalMutation` from THIS file, not from
 * `_generated/server`. A write to `reports` / `apartments` / `bookingEarnings` through the
 * raw constructors bypasses the triggers and silently drifts the counts. The auth wrappers
 * (`authMutation`, `adminMutation`, …) already build on these, so endpoints using them
 * are covered for free. Queries and actions are unaffected — keep importing those from
 * `_generated/server`.
 */
const triggers = new Triggers<DataModel>();

triggers.register('reports', aggregateReports.trigger());
triggers.register('apartments', aggregateApartments.trigger());
triggers.register('bookingEarnings', aggregateHostEarnings.trigger());

export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB));
export const internalMutation = customMutation(rawInternalMutation, customCtx(triggers.wrapDB));
