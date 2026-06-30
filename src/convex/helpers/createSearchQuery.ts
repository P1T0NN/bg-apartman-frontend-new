// LIBRARIES
import { paginationOptsValidator, type PaginationOptions } from 'convex/server';
import { ConvexError, v } from 'convex/values';
import { query } from '../_generated/server';

// CONFIG
import { PAGINATION_DATA } from '@/shared/config.js';

// HELPERS
import { getAuthUserId } from '../auth/helpers/getAuthUserId.js';
import { requireAdmin } from '../auth/middleware/authMiddleware.js';
import { convexRateLimiter } from '../convexRateLimiter.js';

// TYPES
import type { QueryCtx } from '../_generated/server';
import type { ConvexErrorPayload } from '@/shared/types/types.js';
import type { ConvexRateLimitName } from '../rateLimits/registry.js';
import type { DataModel, Doc, TableNames } from '../_generated/dataModel';
import type {
	FieldTypeFromFieldPath,
	NamedSearchIndex,
	NamedTableInfo,
	SearchIndexNames
} from 'convex/server';
import type { ObjectType, PropertyValidators } from 'convex/values';

/**
 * Endpoint-level access gate for dropdown search queries.
 *
 * - `public`: anonymous and signed-in callers may search.
 * - `optionalUser`: same as public, but always resolves `userId` before the builder runs.
 * - `user`: requires any signed-in user.
 * - `admin`: requires a signed-in admin.
 */
export type SearchQueryAuth = 'public' | 'optionalUser' | 'user' | 'admin';

export type SearchQueryAuthContext = {
	userId: string | null;
	auth: SearchQueryAuth;
};

type BuiltinArgs = {
	paginationOpts?: PaginationOptions;
	trustedSearchSecret?: string;
};

type TableInfo<T extends TableNames> = NamedTableInfo<DataModel, T>;
type TableSearchIndexName<T extends TableNames> = SearchIndexNames<TableInfo<T>> & string;
type SearchIndexConfig<
	T extends TableNames,
	IndexName extends TableSearchIndexName<T>
> = NamedSearchIndex<TableInfo<T>, IndexName>;

type SearchFilterFields<
	T extends TableNames,
	IndexName extends TableSearchIndexName<T>
> = SearchIndexConfig<T, IndexName>['filterFields'] & string;

/**
 * Convex search-index access spec.
 *
 * `index` must be a search index declared on the table. `searchField` must match that
 * index's `searchField`, and `eq` keys must be declared in that index's `filterFields`.
 */
export type SearchQuerySpec<T extends TableNames> = {
	[IndexName in TableSearchIndexName<T>]: {
		index: IndexName;
		searchField: SearchIndexConfig<T, IndexName>['searchField'];
		query: string;
		eq?: Partial<{
			[FieldName in SearchFilterFields<T, IndexName>]: FieldTypeFromFieldPath<Doc<T>, FieldName>;
		}>;
	};
}[TableSearchIndexName<T>];

type SearchBuilder<Extra, T extends TableNames> = (
	ctx: QueryCtx,
	args: BuiltinArgs & Extra,
	auth: SearchQueryAuthContext
) => Promise<SearchQuerySpec<T> | null | undefined> | SearchQuerySpec<T> | null | undefined;

export type SearchQueryResult<T extends TableNames> = {
	page: Doc<T>[];
	isDone: boolean;
	continueCursor: string;
};

export type CreateSearchQueryOptions<T extends TableNames, Extra extends PropertyValidators> = {
	/** Target table. Return docs are typed from this table. */
	table: T;
	/**
	 * Endpoint-level auth gate. Defaults to `public`.
	 *
	 * Use `public` for intentionally public suggestions. Use `optionalUser` when the
	 * search spec needs `userId` if present, without rejecting anonymous callers.
	 */
	auth?: SearchQueryAuth;
	/** Extra Convex validators consumed by the `search` builder. */
	args?: Extra;
	/**
	 * Builds the search-index access spec. Returning null/undefined returns an empty page.
	 * This is useful when the caller has not typed enough text yet.
	 */
	search: SearchBuilder<ObjectType<Extra>, T>;
	/**
	 * Minimum trimmed query length before Convex touches the search index.
	 * Defaults to 2. Set to 0 only for very small, intentionally browseable indexes.
	 */
	minQueryLength?: number;
	/**
	 * Server fallback when the caller omits `paginationOpts.numItems`.
	 * Defaults to {@link PAGINATION_DATA.DEFAULT_PAGE_SIZE}.
	 */
	defaultNumItems?: number;
	/**
	 * Hard cap for `paginationOpts.numItems`, regardless of what the client asks for.
	 * Defaults to {@link PAGINATION_DATA.MAX_PAGE_SIZE}.
	 */
	maxNumItems?: number;
	/**
	 * Optional trusted-server gate for public search queries that must only be called
	 * through a SvelteKit remote/server adapter. When set, callers must pass
	 * `trustedSearchSecret` matching this Convex environment variable.
	 */
	trustedSecretEnvName?: string | null;
};

/**
 * Build a reusable Convex query for dropdown/autocomplete search.
 *
 * This helper is intentionally narrower than `fetchOptimized`:
 *
 * - search indexes only; no full-table fallback
 * - cursor pagination only; no offset, totals, sorting, or page-number jumps
 * - server-side result cap for dropdown-sized payloads
 * - optional endpoint auth with row-level scoping expressed in the `search` builder
 *
 * Public search note:
 * Convex queries can only `check` rate limits. They cannot consume tokens, and they
 * do not expose a trustworthy anonymous key like IP/session. When a rate-limit name is
 * supplied, this helper checks signed-in callers per-user and deliberately skips anonymous
 * callers instead of using a shared `"anonymous"` key. For enforceable public anonymous
 * throttling, put a SvelteKit remote function/server route in front of this query and key
 * that route by IP or a trusted anonymous session.
 *
 * @example
 * ```ts
 * export const searchUsers = createSearchQuery('searchUsers', {
 *   table: 'users',
 *   auth: 'user',
 *   args: { q: v.string() },
 *   search: (_ctx, args, auth) => ({
 *     index: 'search_name',
 *     searchField: 'name',
 *     query: args.q,
 *     eq: { organizationId: auth.userId }
 *   })
 * });
 * ```
 */
export function createSearchQuery<
	T extends TableNames,
	Extra extends PropertyValidators = Record<string, never>
>(name: ConvexRateLimitName, options: CreateSearchQueryOptions<T, Extra>): ReturnType<typeof query>;
export function createSearchQuery<
	T extends TableNames,
	Extra extends PropertyValidators = Record<string, never>
>(options: CreateSearchQueryOptions<T, Extra>): ReturnType<typeof query>;
export function createSearchQuery<
	T extends TableNames,
	Extra extends PropertyValidators = Record<string, never>
>(
	nameOrOptions: ConvexRateLimitName | CreateSearchQueryOptions<T, Extra>,
	maybeOptions?: CreateSearchQueryOptions<T, Extra>
) {
	const rateLimitName = typeof nameOrOptions === 'string' ? nameOrOptions : null;
	const options =
		typeof nameOrOptions === 'string'
			? (maybeOptions as CreateSearchQueryOptions<T, Extra>)
			: nameOrOptions;

	return buildSearchQuery(options, rateLimitName);
}

function buildSearchQuery<
	T extends TableNames,
	Extra extends PropertyValidators = Record<string, never>
>(options: CreateSearchQueryOptions<T, Extra>, rateLimitName: ConvexRateLimitName | null) {
	const {
		table,
		auth = 'public',
		args: extraArgs,
		search,
		minQueryLength = 2,
		defaultNumItems = PAGINATION_DATA.DEFAULT_PAGE_SIZE,
		maxNumItems = PAGINATION_DATA.MAX_PAGE_SIZE,
		trustedSecretEnvName = null
	} = options;

	const validators = {
		...(extraArgs ?? {}),
		paginationOpts: v.optional(paginationOptsValidator),
		trustedSearchSecret: v.optional(v.string())
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;

	return query({
		args: validators,
		handler: async (ctx: QueryCtx, rawArgsRaw): Promise<SearchQueryResult<T>> => {
			const rawArgs = rawArgsRaw as BuiltinArgs & ObjectType<Extra>;
			assertTrustedSearchCaller(rawArgs.trustedSearchSecret, trustedSecretEnvName);

			const authContext = await resolveSearchAuth(ctx, auth, Boolean(rateLimitName));
			const searchSpec = await search(ctx, rawArgs, authContext);

			if (!searchSpec) return emptySearchResult();

			const trimmedQuery = searchSpec.query.trim();
			if (trimmedQuery.length < minQueryLength) return emptySearchResult();

			await checkSearchRateLimit(ctx, rateLimitName, authContext.userId);

			const paginationOpts = resolveSearchPaginationOpts({
				opts: rawArgs.paginationOpts,
				defaultNumItems,
				maxNumItems
			});

			const result = await ctx.db
				.query(table)
				.withSearchIndex(searchSpec.index, (sb) => {
					// TypeScript cannot keep the correlation between a dynamic search index
					// name and its search/filter fields through Object.entries, so this
					// boundary stays intentionally small.
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					let chain: any = sb.search(searchSpec.searchField as never, trimmedQuery);

					for (const [field, value] of Object.entries(searchSpec.eq ?? {})) {
						if (value === undefined) continue;
						chain = chain.eq(field, value);
					}

					return chain;
				})
				.paginate(paginationOpts);

			return {
				page: result.page as Doc<T>[],
				isDone: result.isDone,
				continueCursor: result.continueCursor
			};
		}
	});
}

function assertTrustedSearchCaller(
	trustedSearchSecret: string | undefined,
	trustedSecretEnvName: string | null
): void {
	if (!trustedSecretEnvName) return;

	const expectedSecret = process.env[trustedSecretEnvName];
	if (!expectedSecret) {
		throw new Error(`[createSearchQuery] Missing ${trustedSecretEnvName}.`);
	}

	if (trustedSearchSecret !== expectedSecret) {
		throw new ConvexError({
			code: 'FORBIDDEN',
			message: { key: 'GenericMessages.FORBIDDEN' }
		} satisfies ConvexErrorPayload);
	}
}

async function resolveSearchAuth(
	ctx: QueryCtx,
	auth: SearchQueryAuth,
	needsRateLimitUserKey: boolean
): Promise<SearchQueryAuthContext> {
	if (auth === 'admin') {
		return { auth, userId: await requireAdmin(ctx) };
	}

	if (auth === 'user') {
		const userId = await getAuthUserId(ctx);
		if (!userId) throwNotAuthenticated();
		return { auth, userId };
	}

	if (auth === 'optionalUser' || needsRateLimitUserKey) {
		return { auth, userId: await getAuthUserId(ctx) };
	}

	return { auth, userId: null };
}

async function checkSearchRateLimit(
	ctx: QueryCtx,
	rateLimitName: ConvexRateLimitName | null,
	userId: string | null
) {
	if (!rateLimitName || !userId) return;

	const result = await convexRateLimiter.check(ctx, rateLimitName, {
		key: userId
	});

	if (!result.ok) {
		throw new ConvexError({
			kind: 'RateLimited',
			name: rateLimitName,
			retryAfter: result.retryAfter
		});
	}
}

function resolveSearchPaginationOpts(params: {
	opts: PaginationOptions | undefined;
	defaultNumItems: number;
	maxNumItems: number;
}): PaginationOptions {
	const maxNumItems = normalizePositiveInt(params.maxNumItems, PAGINATION_DATA.MAX_PAGE_SIZE);
	const defaultNumItems = Math.min(
		maxNumItems,
		normalizePositiveInt(params.defaultNumItems, PAGINATION_DATA.DEFAULT_PAGE_SIZE)
	);
	const requestedNumItems =
		params.opts?.numItems === undefined
			? defaultNumItems
			: normalizePositiveInt(params.opts.numItems, defaultNumItems);

	return {
		cursor: params.opts?.cursor ?? null,
		numItems: Math.min(requestedNumItems, maxNumItems)
	};
}

function normalizePositiveInt(value: number, fallback: number): number {
	if (!Number.isFinite(value)) return fallback;
	return Math.max(1, Math.floor(value));
}

function emptySearchResult<T extends TableNames>(): SearchQueryResult<T> {
	return {
		page: [],
		isDone: true,
		continueCursor: ''
	};
}

function throwNotAuthenticated(): never {
	throw new ConvexError({
		code: 'NOT_AUTHENTICATED',
		message: { key: 'GenericMessages.NOT_AUTHENTICATED' }
	} satisfies ConvexErrorPayload);
}
