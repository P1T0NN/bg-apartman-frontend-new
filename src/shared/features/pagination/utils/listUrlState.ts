// URL as the single source of truth for a public, server-rendered listing: filters, search
// and page all live in `?query=params`, so every state is a real address — crawlable,
// shareable, back/forward-correct, and working with JavaScript disabled.
//
// Pairs with a `+page.ts` / `+page.server.ts` that reads these, calls a `fetchOptimized`
// query, and hands the rows to `DataList` / `DataTable` as plain props (`pageHref`/`sortHref`).
//
// THE primitive every URL-driven list is built on. Domain codecs layer on top rather than
// re-deriving these rules — `shopSearchParams.ts` is the worked example: it owns what a shop
// filter IS, and delegates what a list URL DOES to this module.
//
// Lives in `shared/` rather than `features/` because it is a pure URL codec — no `$app`, no
// `@sveltejs/kit`, no Svelte, no DOM, only `URL`/`URLSearchParams` — and a shared module that
// Convex imports (`shopSearchParams`) delegates to it.

// CONFIG
import { PAGINATION_DATA } from '@/shared/config';

/** Query-string key holding the 1-based page number. */
export const PAGE_PARAM = 'page';

/** Query-string key holding the cursor stack (cursor pagination — see {@link pushCursorHref}). */
export const CURSOR_STACK_PARAM = 'cs';

/**
 * Params that describe *where you are in the list*, not *what is in it*. Excluded from
 * {@link hasActiveFilters} — see the note there on why conflating them is a bug.
 */
export const POSITION_PARAMS = [PAGE_PARAM, CURSOR_STACK_PARAM, 'cursor'] as const;

/**
 * How many cursors the URL will carry. Cursors are opaque and long (~200 chars each), so the
 * stack is what bounds URL length: 10 keeps the worst case near 2 KB, comfortably inside every
 * server's header limit. Past 10 pages deep the oldest entry is dropped — "previous" still
 * works for the last 10 hops and then lands on the first page.
 */
export const MAX_CURSOR_STACK = PAGINATION_DATA.MAX_CURSOR_STACK;

/** Not in base64, base64url or hex, so it can never appear inside a cursor. */
const CURSOR_SEPARATOR = '~';

/**
 * The trail of cursors that got the user here — one per hop past the first page.
 *
 * Cursor pagination only points forward: a continuation cursor says "what comes after this
 * page" and there is no inverse. Keeping the trail is the only way to offer a real "previous"
 * link, and keeping it *in the URL* is what makes that link work without JavaScript, survive a
 * reload, and be shareable — the same properties the rest of this module exists to preserve.
 */
export function readCursorStack(url: URL, param: string = CURSOR_STACK_PARAM): string[] {
	const raw = url.searchParams.get(param);
	if (!raw) return [];
	return raw.split(CURSOR_SEPARATOR).filter(Boolean).slice(-MAX_CURSOR_STACK);
}

/** Cursor for the page currently being viewed — the newest entry, or `null` on page one. */
export function currentCursor(url: URL, param: string = CURSOR_STACK_PARAM): string | null {
	return readCursorStack(url, param).at(-1) ?? null;
}

/**
 * 1-based position in a cursor-paginated list, derived from how many hops deep the stack is.
 * Exact until the stack is trimmed at {@link MAX_CURSOR_STACK}, after which it under-reports.
 */
export function cursorPage(url: URL, param: string = CURSOR_STACK_PARAM): number {
	return readCursorStack(url, param).length + 1;
}

/** Href for the next page: push `nextCursor` onto the trail. */
export function pushCursorHref(
	url: URL,
	nextCursor: string | null | undefined,
	param: string = CURSOR_STACK_PARAM
): string {
	if (!nextCursor) return listHref(url, { [param]: null });
	const stack = [...readCursorStack(url, param), nextCursor].slice(-MAX_CURSOR_STACK);
	return listHref(url, { [param]: stack.join(CURSOR_SEPARATOR) });
}

/** Href for the previous page: pop the newest entry off the trail. */
export function popCursorHref(url: URL, param: string = CURSOR_STACK_PARAM): string {
	const stack = readCursorStack(url, param).slice(0, -1);
	return listHref(url, { [param]: stack.length ? stack.join(CURSOR_SEPARATOR) : null });
}

/** Query-string key holding the active sort, encoded as `column:direction`. */
export const SORT_PARAM = 'sort';

export type SortDirection = 'asc' | 'desc';
export type ActiveSort = { column?: string; direction?: SortDirection };

/**
 * Active sort from `?sort=name:asc`. Unparseable or unknown values resolve to "no sort" —
 * `allowed` is required so a hand-edited `?sort=passwordHash:asc` can never reach the query
 * and pick an index (or an ordering) the endpoint never meant to expose.
 */
export function readSort(
	url: URL,
	allowed: readonly string[],
	param: string = SORT_PARAM
): ActiveSort {
	const raw = url.searchParams.get(param);
	if (!raw) return {};

	const [column, direction] = raw.split(':');
	if (!column || !allowed.includes(column)) return {};
	if (direction !== 'asc' && direction !== 'desc') return {};

	return { column, direction };
}

/**
 * Href for clicking a sortable header, cycling `desc → asc → off` — the same cycle the
 * component-state table uses, so the two behave identically from the user's side.
 *
 * Changing the sort reorders the whole list, so the position params drop out via
 * {@link listHref} and you land back at the top. That is the correct behaviour: page 4 of a
 * differently-ordered list is a different set of rows.
 *
 * **The server must have an index that produces this order under the active filters.** Sorting
 * is not a post-processing step — an order the index cannot serve either scans the table or
 * silently returns rows in the wrong sequence.
 */
export function sortHref(
	url: URL,
	column: string,
	current: ActiveSort,
	param: string = SORT_PARAM
): string {
	const next: string | null =
		current.column !== column
			? `${column}:desc`
			: current.direction === 'desc'
				? `${column}:asc`
				: null;

	return listHref(url, { [param]: next });
}

/**
 * 1-based page from the URL, floored and clamped to >= 1. Junk (`?page=abc`, `?page=-3`)
 * resolves to page 1 rather than throwing — a crawler or a hand-edited URL must not 500.
 */
export function readPage(url: URL, param: string = PAGE_PARAM): number {
	const raw = Number(url.searchParams.get(param));
	return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
}

/**
 * Build an href from the current URL with `patch` applied, preserving every other param.
 * `null` / `undefined` / `''` deletes a key.
 *
 * Two rules baked in, both of which are easy to get wrong by hand:
 *
 * - **Changing what is listed invalidates where you are in it.** Every position param the
 *   patch does not explicitly name is dropped — switching category from page 7 must land on
 *   page 1, not a page 7 that may no longer exist, and must not carry a cursor that was
 *   computed against the old filter set (Convex cursors are tied to a specific access spec;
 *   reusing one across filters silently returns nothing useful).
 * - **`?page=1` is never emitted.** Page 1 is the bare URL, so a crawler sees one canonical
 *   address for the first page instead of two that duplicate each other.
 */
export function listHref(
	url: URL,
	patch: Record<string, string | number | null | undefined> = {},
	param: string = PAGE_PARAM
): string {
	const next = new URLSearchParams(url.searchParams);

	for (const positional of new Set<string>([param, ...POSITION_PARAMS])) {
		if (!(positional in patch)) next.delete(positional);
	}

	for (const [key, value] of Object.entries(patch)) {
		if (value === null || value === undefined || value === '') next.delete(key);
		else next.set(key, String(value));
	}

	if (next.get(param) === '1') next.delete(param);

	const qs = next.toString();
	return qs ? `${url.pathname}?${qs}` : url.pathname;
}

/**
 * Whether the user has narrowed the list — used to choose between "no products yet" and
 * "no products match your filters".
 *
 * Position params are ignored by default: **pagination is not a filter.** Treating it as one
 * makes an empty page 9 render "try clearing your filters" and makes reset logic wipe filters
 * the user did set. `cursor` counts as position too — a search cursor is a bookmark into a
 * result set, not another thing the user narrowed by.
 */
export function hasActiveFilters(url: URL, ignore: readonly string[] = POSITION_PARAMS): boolean {
	for (const [key, value] of url.searchParams) {
		if (!ignore.includes(key) && value !== '') return true;
	}
	return false;
}
