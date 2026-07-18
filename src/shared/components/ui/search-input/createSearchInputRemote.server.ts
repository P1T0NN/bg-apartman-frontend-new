// SVELTEKIT IMPORTS
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';

// LIBRARIES
import { isRateLimitError } from '@convex-dev/rate-limiter';
import { createConvexHttpClient } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { api } from '@/convex/_generated/api';
import { m } from '@/shared/lib/paraglide/messages';

// UTILS
import { resolveClientAddress } from '@/utils/clientAddress.js';

// SCHEMAS
import type { SearchInputRemoteSchemaInput } from './searchInputSchemas.js';

// TYPES
import type { RequestEvent } from '@sveltejs/kit';
import type {
	DefaultFunctionArgs,
	FunctionArgs,
	FunctionReference,
	FunctionReturnType
} from 'convex/server';
import type { ConvexRateLimitName } from '@/convex/rateLimits/registry.js';
import type { SearchInputItem, SearchInputRemoteCommandResult } from './types.js';

const DEFAULT_SEARCH_LIMIT_SECRET_ENV = 'SEARCH_INPUT_RATE_LIMIT_SECRET';
const DEFAULT_REMOTE_SEARCH_RESULTS = 5;
const DEFAULT_REMOTE_SEARCH_MAX_RESULTS = 25;
const DEFAULT_REMOTE_MIN_QUERY_LENGTH = 1;

export type SearchInputRemoteQuery<Row = unknown> = FunctionReference<
	'query',
	'public',
	DefaultFunctionArgs,
	{
		page: Row[];
		isDone: boolean;
		continueCursor: string;
	}
>;

export type SearchInputRemoteQueryRow<Query extends SearchInputRemoteQuery> =
	FunctionReturnType<Query> extends { page: Array<infer Row> } ? Row : unknown;

export type NormalizedSearchInputRemoteInput = {
	source: string;
	search: string;
	maxResults: number;
	cursor: string | null;
};

export type SearchInputRemoteHandlerContext = {
	event: RequestEvent;
	source: string;
	trustedSecret: string;
};

export type SearchInputRateLimitKeyResolver = (params: {
	event: RequestEvent;
	source: string;
	input: NormalizedSearchInputRemoteInput;
}) => string | Promise<string>;

export type SearchInputAuthenticatedRateLimitKey = 'user' | 'fallback' | 'userAndFallback';

export type SearchInputRemoteSource<
	Row = unknown,
	Query extends SearchInputRemoteQuery<Row> = SearchInputRemoteQuery<Row>
> = {
	query: Query;
	rateLimitName: ConvexRateLimitName;
	minQueryLength?: number;
	defaultMaxResults?: number;
	maxResults?: number;
	authenticatedRateLimitKey?: SearchInputAuthenticatedRateLimitKey;
	toArgs: (
		input: NormalizedSearchInputRemoteInput,
		context: SearchInputRemoteHandlerContext
	) => FunctionArgs<Query>;
	mapItem: (row: Row) => SearchInputItem;
	resolveRateLimitKey?: SearchInputRateLimitKeyResolver;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySearchInputRemoteQuery = SearchInputRemoteQuery<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySearchInputRemoteSource = SearchInputRemoteSource<any, AnySearchInputRemoteQuery>;

export type SearchInputRemoteSources = Record<string, AnySearchInputRemoteSource>;

export function defineSearchInputRemoteSource<
	Row = unknown,
	Query extends SearchInputRemoteQuery<Row> = SearchInputRemoteQuery<Row>
>(source: SearchInputRemoteSource<Row, Query>): SearchInputRemoteSource<Row, Query> {
	return source;
}

export type CreateSearchInputRemoteHandlerOptions<Sources extends SearchInputRemoteSources> = {
	sources: Sources;
	secretEnvName?: string;
	defaultMaxResults?: number;
	maxResults?: number;
	authenticatedRateLimitKey?: SearchInputAuthenticatedRateLimitKey;
	resolveRateLimitKey?: SearchInputRateLimitKeyResolver;
	createClient?: () => ReturnType<typeof createConvexHttpClient>;
};

export function createSearchInputRemoteHandler<const Sources extends SearchInputRemoteSources>({
	sources,
	secretEnvName = DEFAULT_SEARCH_LIMIT_SECRET_ENV,
	defaultMaxResults = DEFAULT_REMOTE_SEARCH_RESULTS,
	maxResults = DEFAULT_REMOTE_SEARCH_MAX_RESULTS,
	authenticatedRateLimitKey = 'user',
	resolveRateLimitKey = defaultSearchRateLimitKey,
	createClient = createConvexHttpClient
}: CreateSearchInputRemoteHandlerOptions<Sources>) {
	const sourceNames = Object.keys(sources);
	if (sourceNames.length === 0) {
		throw new Error('[createSearchInputRemoteHandler] At least one search source is required.');
	}

	return async (input: SearchInputRemoteSchemaInput): Promise<SearchInputRemoteCommandResult> => {
		const sourceName = input.source.trim();
		const source = sources[sourceName];

		if (!source) {
			error(400, m['SearchInput.unknownSource']());
		}

		const normalizedInput = normalizeSearchInput(input, sourceName, source, {
			defaultMaxResults,
			maxResults
		});

		if (
			normalizedInput.search.length < (source.minQueryLength ?? DEFAULT_REMOTE_MIN_QUERY_LENGTH)
		) {
			return emptySearchResult();
		}

		const event = getRequestEvent();
		const client = createClient();
		const trustedSecret = resolveTrustedSecret(secretEnvName);
		const rateLimitFallbackKey = await (source.resolveRateLimitKey ?? resolveRateLimitKey)({
			event,
			source: sourceName,
			input: normalizedInput
		});

		if (!rateLimitFallbackKey) {
			error(500, m['SearchInput.rateLimitKeyUnavailable']());
		}

		await consumeSearchRateLimit(client, {
			name: source.rateLimitName,
			source: sourceName,
			fallbackKey: rateLimitFallbackKey,
			authenticatedKey: source.authenticatedRateLimitKey ?? authenticatedRateLimitKey,
			secret: trustedSecret
		});

		let result: Awaited<ReturnType<typeof client.query>>;
		try {
			result = await client.query(
				source.query,
				source.toArgs(normalizedInput, { event, source: sourceName, trustedSecret })
			);
		} catch (cause) {
			const message = cause instanceof Error ? cause.message : m['SearchInput.searchFailed']();
			error(502, message);
		}

		return {
			page: result.page.map(source.mapItem).slice(0, normalizedInput.maxResults),
			isDone: result.isDone,
			continueCursor: result.continueCursor
		};
	};
}

function normalizeSearchInput(
	input: SearchInputRemoteSchemaInput,
	source: string,
	config: Pick<AnySearchInputRemoteSource, 'defaultMaxResults' | 'maxResults'>,
	defaults: { defaultMaxResults: number; maxResults: number }
): NormalizedSearchInputRemoteInput {
	const sourceMaxResults = normalizePositiveInt(
		config.maxResults ?? defaults.maxResults,
		defaults.maxResults
	);
	const fallbackMaxResults = Math.min(
		sourceMaxResults,
		normalizePositiveInt(
			config.defaultMaxResults ?? defaults.defaultMaxResults,
			defaults.defaultMaxResults
		)
	);

	return {
		source,
		search: input.search.trim(),
		cursor: input.cursor ?? null,
		maxResults: Math.min(
			sourceMaxResults,
			input.maxResults === undefined
				? fallbackMaxResults
				: normalizePositiveInt(input.maxResults, fallbackMaxResults)
		)
	};
}

async function consumeSearchRateLimit(
	client: ReturnType<typeof createConvexHttpClient>,
	args: {
		name: ConvexRateLimitName;
		source: string;
		fallbackKey: string;
		authenticatedKey: SearchInputAuthenticatedRateLimitKey;
		secret: string;
	}
): Promise<void> {
	try {
		await client.mutation(api.rateLimits.searchRateLimitMutations.consumeSearchRateLimit, args, {
			skipQueue: true
		});
	} catch (cause) {
		if (isRateLimitError(cause)) {
			error(429, m['SearchInput.tooManyRequests']());
		}

		const message = cause instanceof Error ? cause.message : m['SearchInput.searchFailed']();
		error(502, message);
	}
}

function resolveTrustedSecret(secretEnvName: string): string {
	const secret = env[secretEnvName];
	if (!secret) {
		error(500, m['SearchInput.rateLimitNotConfigured']());
	}
	return secret;
}

/**
 * Default bucket identity:
 * - signed-in request -> Convex upgrades this fallback to per source + per user
 * - anonymous request -> Convex uses this per source + per IP fallback
 *
 * Projects that need stricter behavior can combine this fallback with the user id by
 * setting `authenticatedRateLimitKey: 'userAndFallback'`.
 */
function defaultSearchRateLimitKey({
	event,
	source
}: {
	event: RequestEvent;
	source: string;
}): string {
	const clientAddress = resolveClientAddress(event);
	if (!clientAddress) {
		error(400, m['SearchInput.clientAddressRequired']());
	}

	return `search-input:${source}:ip:${clientAddress}`;
}

function normalizePositiveInt(value: number, fallback: number): number {
	if (!Number.isFinite(value)) return fallback;
	return Math.max(1, Math.floor(value));
}

function emptySearchResult(): SearchInputRemoteCommandResult {
	return {
		page: [],
		isDone: true,
		continueCursor: ''
	};
}
