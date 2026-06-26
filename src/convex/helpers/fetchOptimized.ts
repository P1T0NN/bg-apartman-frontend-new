// LIBRARIES
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { query } from '../_generated/server';

// HELPERS
import { defaultPaginationOpts, normalizeOneBasedPage } from './paginationHelpers.js';
import { getAuthUserId } from '../auth/helpers/getAuthUserId.js';
import { requireAdmin } from '../auth/middleware/authMiddleware.js';
import { convexRateLimiter } from '../convexRateLimiter.js';

// TYPES
import { ConvexError } from 'convex/values';
import type { QueryCtx } from '../_generated/server';
import type { ConvexErrorPayload } from '../types/convexTypes.js';
import type { ConvexRateLimitName } from '../rateLimits/registry.js';
import type { Doc, DataModel, TableNames } from '../_generated/dataModel';
import type {
	IndexNames,
	NamedTableInfo,
	OrderedQuery,
	SearchIndexNames
} from 'convex/server';
import type { ObjectType, PropertyValidators } from 'convex/values';

// ─── Strategy + result shapes ────────────────────────────────────────────────

/**
 * Pagination shape. Pick per call site based on the UX you actually need.
 *
 * | strategy   | server cost   | totalCount | jump-to-page | reactive blast radius                    |
 * | ---------- | ------------- | ---------- | ------------ | ---------------------------------------- |
 * | `'cursor'` | O(perPage)    | `null`     | no           | only docs in the active page invalidate  |
 * | `'offset'` | O(rows)       | exact      | yes          | any change to the table reruns the query |
 *
 * Default `'cursor'` because it's the only one that stays cheap as the table grows.
 * Pick `'offset'` only when you need page-number jumps or an accurate total — and only on
 * tables you trust to stay small.
 */
export type FetchOptimizedStrategy = 'cursor' | 'offset';

/**
 * Unified return shape. Sentinels (`''` / `null`) keep the type stable across strategies so
 * callers don't branch on `strategy` to render a list. `totalCount` is `null` in cursor and
 * search modes — computing it would defeat the optimization.
 */
export type FetchOptimizedResult<T extends TableNames, Item = Doc<T>> = {
	page: Item[];
	isDone: boolean;
	continueCursor: string;
	totalCount: number | null;
};

// ─── Access patterns ─────────────────────────────────────────────────────────

/**
 * One-or-two-sided range on the trailing index field. Convex permits at most one of
 * `gt`/`gte` and one of `lt`/`lte`, combined for half/closed intervals. Mixing in `eq` on
 * the same field is rejected by Convex at runtime, so put scalar matches in {@link eq}
 * and bounds here.
 */
export type FetchOptimizedRange<T extends TableNames> = {
	field: keyof Doc<T> | '_creationTime';
	gt?: unknown;
	gte?: unknown;
	lt?: unknown;
	lte?: unknown;
};

/**
 * Index-bounded access. `eq` keys MUST appear in the index's declared field order
 * (JS preserves object insertion order — caller controls it), and only a strict prefix
 * of the index can use `eq`. The trailing field is the only one that takes a `range`.
 *
 * This compiles to `q.withIndex(index, idx => idx.eq(...).gte/lte(...))` under the hood.
 * Cost: O(matching rows), not O(table). Filtering without an index is intentionally not
 * supported — `.filter()` is post-scan and silently degrades to O(table) + thin pages.
 */
export type FetchOptimizedWhere<T extends TableNames> = {
	index: IndexNames<NamedTableInfo<DataModel, T>>;
	eq?: Partial<Doc<T>>;
	range?: FetchOptimizedRange<T>;
};

/**
 * Full-text access. Compiles to `q.withSearchIndex(index, q => q.search(field, query).eq(...))`.
 * Search results are relevance-ordered — `order` is ignored when `search` is supplied.
 * `eq` here must reference fields declared as `filterFields` on the search index in
 * `schema.ts`, not arbitrary doc keys.
 */
export type FetchOptimizedSearch<T extends TableNames> = {
	index: SearchIndexNames<NamedTableInfo<DataModel, T>>;
	/** The schema-declared `searchField` of the index. */
	searchField: keyof Doc<T>;
	/** Query string from the user. Empty string returns no rows by Convex semantics. */
	query: string;
	eq?: Partial<Doc<T>>;
};

// ─── Builder option types ────────────────────────────────────────────────────

/** Args every `fetchOptimized` query receives, regardless of caller-supplied extras. */
type BuiltinArgs = {
	paginationOpts?: { numItems: number; cursor: string | null };
	page?: number;
};

/** Builder fn — receives ctx + the merged (builtin + caller) args, returns access spec. */
type AccessBuilder<Extra, R> = (
	ctx: QueryCtx,
	args: BuiltinArgs & Extra
) => Promise<R | null | undefined> | R | null | undefined;

/**
 * Endpoint-level access gate. Runs before any db work, so unauthorized callers pay the
 * minimum possible cost.
 *
 * - `'user'` — caller must have an authenticated session; throws `NOT_AUTHENTICATED`.
 * - `'admin'` — caller must be authenticated AND have `role === 'admin'`; throws
 *   `NOT_AUTHENTICATED` or `ADMIN_ACCESS_REQUIRED` (see {@link requireAdmin}).
 *
 * Omit (or `undefined`) for public endpoints. For row-level rules (owner-only, group
 * membership, etc.) gate inside the {@link FetchOptimizedOptions.where} builder using
 * {@link getAuthUserId} + ctx reads — `auth` is the cheap whole-endpoint guard.
 */
export type FetchOptimizedAuth = 'user' | 'admin';

/**
 * Advisory rate-limit note for rate-limited query variants.
 *
 * Convex queries cannot consume rate-limit tokens (writes aren't allowed in queries), so we
 * use `convexRateLimiter.check(...)` which inspects the bucket without decrementing it. The throw
 * is real (typed `ConvexError` recognized by `isRateLimitError` on the client), but a
 * malicious caller that ignores the error and re-subscribes won't actually be slowed down.
 * Pair with `auth: 'user'` so the bucket key is per-user.
 */

export type FetchOptimizedOptions<
	T extends TableNames,
	Extra extends PropertyValidators,
	Item = Doc<T>
> = {
	/** Target table. The validator + return type are derived from this. */
	table: T;
	/** See {@link FetchOptimizedStrategy}. Defaults to `'cursor'`. */
	strategy?: FetchOptimizedStrategy;
	/**
	 * Endpoint-level auth gate. See {@link FetchOptimizedAuth}. Runs before access-spec
	 * resolution and any db work; non-passing callers get a typed `ConvexError`.
	 */
	auth?: FetchOptimizedAuth;
	/**
	 * Sort direction along the chosen index (or `_creationTime` when no `where`/`search`).
	 * Ignored in search mode (relevance order). Defaults to `'desc'`.
	 *
	 * Pass a function `(args) => 'asc' | 'desc'` to derive the direction at request time —
	 * enables the data-table's sortable column headers to round-trip to the server (the
	 * table forwards `sortDirection` inside `args`).
	 */
	order?:
		| 'asc'
		| 'desc'
		| ((args: BuiltinArgs & ObjectType<Extra>) => 'asc' | 'desc');
	/**
	 * Extra validators added to the query's args. Use this to accept caller input that the
	 * `where`/`search` builders depend on (e.g. `{ city: v.string() }`).
	 */
	args?: Extra;
	/**
	 * Build an indexed access spec at runtime. Receives the QueryCtx (for auth lookups,
	 * cross-table reads) and the merged args. Return `null`/`undefined` to skip indexing
	 * (full table walk along `_creationTime` — only OK on small tables). Mutually
	 * exclusive with {@link search}; supplying both throws.
	 */
	where?: AccessBuilder<ObjectType<Extra>, FetchOptimizedWhere<T>>;
	/**
	 * Build a search-index spec at runtime. Same contract as {@link where} but compiles to
	 * `withSearchIndex`. Mutually exclusive with `where`. Forces strategy off `order`
	 * (search results come back relevance-ordered).
	 */
	search?: AccessBuilder<ObjectType<Extra>, FetchOptimizedSearch<T>>;
	/**
	 * Resolve the full row set in application code instead of via index/search, then
	 * paginate it in memory. Use when the rows can't be expressed as an index range — e.g.
	 * a client-held id list resolved with per-id `ctx.db.get`. Mutually exclusive with
	 * `where`/`search` (they're skipped when `collect` is supplied).
	 *
	 * Prefer `strategy: 'offset'` so the UI gets an exact `totalCount`. Cost is O(rows
	 * resolved); keep the input bounded (the builder should cap its own list).
	 */
	collect?: AccessBuilder<ObjectType<Extra>, Doc<T>[]>;
	/**
	 * Map each row of the returned page to a public DTO (e.g. strip internal fields, project
	 * to a lean card shape). Applied uniformly across every strategy/access path. When set,
	 * the query's `page` is `Item[]`; when omitted, `page` stays `Doc<T>[]`.
	 */
	projectPage?: (doc: Doc<T>, ctx: QueryCtx, args: BuiltinArgs & ObjectType<Extra>) => Item;
};

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * Apply equalities + range to a Convex `IndexRangeBuilder`. Iteration order of `eq` is
 * caller-controlled (JS preserves insertion order) and must match the index's field
 * declaration order — the helper does not (cannot) reorder for you.
 */

function applyIndexBounds(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	idx: any,
	eq: Record<string, unknown> | undefined,
	range:
		| { field: string | symbol | number; gt?: unknown; gte?: unknown; lt?: unknown; lte?: unknown }
		| undefined
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
	let chain = idx;
	if (eq) {
		for (const [field, value] of Object.entries(eq)) {
			if (value === undefined) continue; // skip "not provided" so callers can pass partials
			chain = chain.eq(field, value);
		}
	}
	if (range) {
		// Convex's IndexRangeBuilder only supports one lower + one upper bound; we apply
		// whichever the caller supplied and let Convex throw on illegal combinations.
		if (range.gt !== undefined) chain = chain.gt(range.field, range.gt);
		if (range.gte !== undefined) chain = chain.gte(range.field, range.gte);
		if (range.lt !== undefined) chain = chain.lt(range.field, range.lt);
		if (range.lte !== undefined) chain = chain.lte(range.field, range.lte);
	}
	return chain;
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Factory that produces a paginated, optimized Convex `query` for a given table.
 *
 * ```ts
 * // 1) Plain list, cursor pagination, newest first.
 * export const fetchUploadedFiles = fetchOptimized({ table: 'uploadedFiles' });
 *
 * // 2) Owner-scoped list (auth-derived filter, no extra args).
 * export const fetchMyFiles = fetchOptimized({
 *   table: 'uploadedFiles',
 *   where: async (ctx) => {
 *     const ownerId = await getAuthUserId(ctx);
 *     if (!ownerId) return null;
 *     return { index: 'by_owner', eq: { ownerId } };
 *   }
 * });
 *
 * // 3) City + price-range filter from caller args.
 * export const fetchApartments = fetchOptimized({
 *   table: 'apartments',
 *   args: { city: v.string(), minPrice: v.optional(v.number()) },
 *   where: (_ctx, args) => ({
 *     index: 'by_city_price',
 *     eq: { city: args.city },
 *     range: args.minPrice !== undefined
 *       ? { field: 'price', gte: args.minPrice }
 *       : undefined
 *   })
 * });
 *
 * // 4) Full-text search — pass the function name for advisory rate limiting and pair
 * //    with `auth: 'user'` so the bucket key is per-user.
 * export const searchApartments = fetchOptimized('searchApartments', {
 *   table: 'apartments',
 *   auth: 'user',
 *   args: { q: v.string() },
 *   search: (_ctx, args) => ({
 *     index: 'search_title',
 *     searchField: 'title',
 *     query: args.q
 *   })
 * });
 *
 * // 5) Admin-only audit log (endpoint-level gate).
 * export const fetchAuditLog = fetchOptimized({
 *   table: 'auditLog',
 *   auth: 'admin'
 * });
 * ```
 *
 * ## Why this is "optimized"
 *
 * 1. **Native `.paginate()` in cursor mode.** `.collect()` reads every row on every call AND
 *    on every reactive invalidation; `.paginate()` reads exactly `numItems` rows and only
 *    re-runs subscriptions when the active page changes. Stays flat from 10 to 100k+ rows.
 *
 * 2. **Index-only filtering.** `where` compiles to `withIndex` — O(matching rows). The
 *    factory deliberately omits a `.filter()`-based fallback; that path silently degrades to
 *    O(table) + thin pages, which is exactly the failure mode this helper exists to prevent.
 *    If you need a new filter, add the index in `schema.ts`.
 *
 * 3. **Search via `withSearchIndex`.** Routed to Convex's relevance-ranked search, paginated
 *    natively. `eq` filters here are `filterFields` on the search index, not post-scan.
 *
 * 4. **Stable cursor identity.** Each (cursor, numItems, accessSpec) tuple is its own
 *    subscription — paged history hits the query cache; only the live page re-evaluates on
 *    writes.
 *
 * 5. **Offset mode kept honest.** Still O(rows) — that's unavoidable without an aggregate.
 *    The factory just stops you from re-deriving `totalCount`/`slice`/`isDone`/page-clamp at
 *    every call site.
 *
 * ## Cursor invalidation (caller responsibility)
 *
 * Cursors are opaque tokens computed against a specific access spec — `where` eq values,
 * `search` query string, `order`, etc. If any of those inputs changes between requests
 * (user types in a search box, switches filter), the cursor from the previous spec is
 * meaningless against the new one. Convex won't crash — it returns nothing useful.
 *
 * **Reset cursor state on filter change in the client.** The `DataTable` does this
 * implicitly (its cursor stack lives on the component instance), but any custom client
 * threading args alongside a cursor must reset the cursor whenever args change. The helper
 * itself can't know — it sees each request in isolation.
 *
 * ## Auth + rate-limit
 *
 * Three layers, composable:
 *
 *   - `auth` — endpoint-level gate. `'user'` requires any session, `'admin'`
 *     requires `role === 'admin'`. Cheapest and earliest check.
 *   - Function name (rate-limited overload) — advisory rate-limit via `convexRateLimiter.check`.
 *     Always pair with `auth: 'user'` (or `'admin'`) so the bucket key is per-user.
 *     **Strongly recommended for `search` endpoints.**
 *   - `where` builder — row-level rules. Read auth/userId/roles inside the builder and use
 *     them to compute `eq`/`range`. This is how you express "only my files" without making
 *     the endpoint admin-only.
 *
 * Omit all three for fully public, unmetered lists (only safe on tiny tables).
 */
export function fetchOptimized<
	T extends TableNames,
	Extra extends PropertyValidators = Record<string, never>,
	Item = Doc<T>
>(
	name: ConvexRateLimitName,
	options: FetchOptimizedOptions<T, Extra, Item>
): ReturnType<typeof query>;
export function fetchOptimized<
	T extends TableNames,
	Extra extends PropertyValidators = Record<string, never>,
	Item = Doc<T>
>(
	options: FetchOptimizedOptions<T, Extra, Item>
): ReturnType<typeof query>;
export function fetchOptimized<
	T extends TableNames,
	Extra extends PropertyValidators = Record<string, never>,
	Item = Doc<T>
>(
	nameOrOptions: ConvexRateLimitName | FetchOptimizedOptions<T, Extra, Item>,
	maybeOptions?: FetchOptimizedOptions<T, Extra, Item>
) {
	const rateLimitName =
		typeof nameOrOptions === 'string' ? nameOrOptions : null;
	const options =
		typeof nameOrOptions === 'string'
			? (maybeOptions as FetchOptimizedOptions<T, Extra, Item>)
			: nameOrOptions;

	return buildFetchOptimizedQuery(options, rateLimitName);
}

function buildFetchOptimizedQuery<
	T extends TableNames,
	Extra extends PropertyValidators = Record<string, never>,
	Item = Doc<T>
>(
	options: FetchOptimizedOptions<T, Extra, Item>,
	rateLimitName: ConvexRateLimitName | null
) {
	const {
		table,
		strategy = 'cursor',
		order = 'desc',
		auth,
		args: extraArgs,
		where,
		search,
		collect,
		projectPage
	} = options;

	if (search && strategy === 'offset') {
		// Convex search indexes don't support `.collect()` — only `.paginate()`. Fail fast at
		// factory build time so this surfaces during dev, not on the first prod request.
		throw new Error(
			`[fetchOptimized:${table}] 'search' requires 'strategy: cursor' — Convex search indexes are paginate-only.`
		);
	}

	const validators = {
		paginationOpts: v.optional(paginationOptsValidator),
		/** 1-based page index; consumed only by `'offset'`, ignored by `'cursor'`. */
		page: v.optional(v.number()),
		...(extraArgs ?? {})
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;

	return query({
		args: validators,
		handler: async (ctx: QueryCtx, rawArgsRaw): Promise<FetchOptimizedResult<T, Item>> => {
			const rawArgs = rawArgsRaw as BuiltinArgs & ObjectType<Extra>;
			const opts = rawArgs.paginationOpts ?? defaultPaginationOpts;

			// 0. Endpoint-level auth gate. Runs first so unauthorized callers pay nothing.
			//    Throws typed `ConvexError`s the client can route through `translateFromBackend`.
			let authedUserId: string | null = null;
			if (auth === 'admin') {
				authedUserId = await requireAdmin(ctx);
			} else if (auth === 'user') {
				authedUserId = await getAuthUserId(ctx);
				if (!authedUserId) {
					throw new ConvexError({
						code: 'NOT_AUTHENTICATED',
						message: { key: 'GenericMessages.NOT_AUTHENTICATED' }
					} satisfies ConvexErrorPayload);
				}
			} else if (rateLimitName) {
				// Auth not required for the endpoint, but we still want a per-user key for the
				// rate-limit bucket when possible — fall back to the auth subject if available.
				authedUserId = await getAuthUserId(ctx);
			}

			// 0b. Advisory rate-limit. Convex queries can only `check` (no token consumption).
			//     Throws a ConvexError shaped to be recognized by `isRateLimitError` so existing
			//     client handlers (toast + retry) work unchanged.
			if (rateLimitName) {
				const result = await convexRateLimiter.check(ctx, rateLimitName, {
					key: authedUserId ?? 'anonymous'
				});
				if (!result.ok) {
					throw new ConvexError({
						kind: 'RateLimited',
						name: rateLimitName,
						retryAfter: result.retryAfter
					});
				}
			}

			// Project a page of rows to the public DTO. Identity when no `projectPage` is set
			// (Item defaults to Doc<T>), so non-projecting callers are unaffected.
			const projectRows = async (rows: Doc<T>[]): Promise<Item[]> => {
				if (!projectPage) return rows as unknown as Item[];
				return rows.map((doc) => projectPage(doc, ctx, rawArgs));
			};

			// 1. In-memory collect path — paginate a caller-resolved row set (e.g. an id list
			//    resolved with per-id `ctx.db.get`). Skips index/search access entirely.
			if (collect) {
				const all = (await collect(ctx, rawArgs)) ?? [];

				if (strategy === 'cursor') {
					const parsed = opts.cursor ? Number.parseInt(opts.cursor, 10) : 0;
					const start = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
					const slice = all.slice(start, start + opts.numItems);
					const nextStart = start + slice.length;
					return {
						page: await projectRows(slice),
						isDone: nextStart >= all.length,
						continueCursor: String(nextStart),
						totalCount: null
					};
				}

				const page1BasedCollect = normalizeOneBasedPage(rawArgs.page);
				const totalCountCollect = all.length;
				const startCollect = Math.max(0, (page1BasedCollect - 1) * opts.numItems);
				const sliceCollect = all.slice(startCollect, startCollect + opts.numItems);
				return {
					page: await projectRows(sliceCollect),
					isDone: startCollect + sliceCollect.length >= totalCountCollect,
					continueCursor: '',
					totalCount: totalCountCollect
				};
			}

			// 2. Resolve the access spec at request time. Builders may read auth/ctx/args.
			//    Both can be supplied so a single endpoint can switch between search / index
			//    access by inspecting `args` — but only one may be active per request, since
			//    Convex picks exactly one access pattern. Builders express "not active" by
			//    returning null/undefined.
			const whereSpec = where ? await where(ctx, rawArgs) : null;
			const searchSpec = search ? await search(ctx, rawArgs) : null;
			if (whereSpec && searchSpec) {
				throw new Error(
					`[fetchOptimized:${table}] both 'where' and 'search' resolved to a spec — return null from one of them based on args (typically: search active when args.search non-empty, where otherwise).`
				);
			}

			const resolvedOrder = typeof order === 'function' ? order(rawArgs) : order;

			// 3. Build the base query. Three branches: search > where > full-table.
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let q: OrderedQuery<NamedTableInfo<DataModel, T>> | any;

			if (searchSpec) {
				q = ctx.db.query(table).withSearchIndex(searchSpec.index, (sb) => {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					let chain: any = sb.search(
						searchSpec.searchField as never,
						searchSpec.query
					);
					for (const [field, value] of Object.entries(searchSpec.eq ?? {})) {
						if (value === undefined) continue;
						chain = chain.eq(field, value);
					}
					return chain;
				});
			} else if (whereSpec) {
				q = ctx.db
					.query(table)
					.withIndex(whereSpec.index, (idx) =>
						applyIndexBounds(idx, whereSpec.eq, whereSpec.range)
					)
					.order(resolvedOrder);
			} else {
				q = ctx.db.query(table).order(resolvedOrder);
			}

			// 4. Paginate per strategy. Cursor uses native paginate; offset still slices.
			if (strategy === 'cursor') {
				const result = await q.paginate(opts);
				return {
					page: await projectRows(result.page as Doc<T>[]),
					isDone: result.isDone,
					continueCursor: result.continueCursor,
					totalCount: null
				};
			}

			const page1Based = normalizeOneBasedPage(rawArgs.page);
			const all = (await q.collect()) as Doc<T>[];
			const totalCount = all.length;
			const start = Math.max(0, (page1Based - 1) * opts.numItems);
			const slice = all.slice(start, start + opts.numItems);
			const isDone = start + slice.length >= totalCount;

			return {
				page: await projectRows(slice),
				isDone,
				continueCursor: '',
				totalCount
			};
		}
	});
}
