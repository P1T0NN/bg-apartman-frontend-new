// Postinstall patch: @vllnt/convex-analytics (all canaries) ships a dangling
// `./_generated/component.js` export but never the file. Convex codegen types the
// host's `components.analytics` from that export, so tsc fails without it.
// Regenerate it here (idempotent — skip if a fixed build already ships one).
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dir = join(root, 'node_modules', '@vllnt', 'convex-analytics', 'dist', 'component', '_generated');
const dts = join(dir, 'component.d.ts');

if (existsSync(dts)) {
  process.exit(0);
}

mkdirSync(dir, { recursive: true });

writeFileSync(
  dts,
  `/**
 * Generated \`ComponentApi\` utility.
 * THIS CODE IS AUTOMATICALLY GENERATED.
 * @module
 */
import type { FunctionReference } from "convex/server";

type Granularity = "minute" | "hour" | "day";
type Scalar = string | number | boolean | null;
type Props = Record<string, Scalar>;
type Range = { from?: number; to?: number };
type Where = { dim: string; val: Scalar };

export type ComponentApi<Name extends string | undefined = string | undefined> = {
  mutations: {
    track: FunctionReference<"mutation", "public", {
      ts?: number;
      subjectRef?: string;
      sessionRef?: string;
      props?: Props;
      dedupeKey?: string;
      sampleRate?: number;
      name: string;
      scope: string;
      granularities: Granularity[];
      dimensions: string[];
    }, "tracked" | "dropped" | "duplicate", Name>;
    configSet: FunctionReference<"mutation", "public", { value: string; key: string; scope: string }, null, Name>;
    configure: FunctionReference<"mutation", "public", { sampleRate?: number; retentionDays?: number; sessionIdleMs?: number; scope: string }, null, Name>;
  };
  queries: {
    metric: FunctionReference<"query", "public", { range?: Range; where?: Where; name: string; scope: string }, number, Name>;
    top: FunctionReference<"query", "public", { limit?: number; range?: Range; name: string; scope: string; dimension: string }, { value: string; count: number }[], Name>;
    timeseries: FunctionReference<"query", "public", { where?: Where; name: string; scope: string; granularity: Granularity; range: Range }, { bucket: number; count: number }[], Name>;
    uniques: FunctionReference<"query", "public", { scope: string; granularity: Granularity; range: Range }, { dau: number; wau: number; mau: number; trend: { bucket: number; uniques: number }[] }, Name>;
    funnel: FunctionReference<"query", "public", { scope: string; range: Range; steps: string[] }, { name: string; count: number; rate: number }[], Name>;
    retention: FunctionReference<"query", "public", { granularity?: Granularity; scope: string; cohortRange: Range; periods: number }, { cohort: number; size: number; retained: number[] }[], Name>;
    distribution: FunctionReference<"query", "public", { range?: Range; where?: Where; name: string; scope: string; measure: string; buckets: number[] }, { bins: { upper: number; count: number }[]; overflow: number; count: number; sum: number }, Name>;
    list: FunctionReference<"query", "public", { name: string; scope: string; paginationOpts: { numItems: number; cursor: string | null } }, { page: { _id: string; _creationTime: number; scope: string; name: string; subjectRef?: string; sessionRef?: string; props: Props; ts: number; seq: number; dedupeKey?: string }[]; isDone: boolean; continueCursor: string }, Name>;
    configGet: FunctionReference<"query", "public", { key: string; scope: string }, string | null, Name>;
  };
  internal_mutations: {
    prune: FunctionReference<"mutation", "internal", { scope?: string }, { deleted: number }, Name>;
    closeSessions: FunctionReference<"mutation", "internal", { scope?: string }, { closed: number }, Name>;
    backfill: FunctionReference<"mutation", "internal", { name: string; scope: string; granularities: Granularity[]; dimensions: string[] }, { events: number; rows: number }, Name>;
  };
};
`
);

writeFileSync(join(dir, 'component.js'), 'export {};\n');

console.log('[patch-vllnt-analytics] generated missing component.d.ts / component.js');
