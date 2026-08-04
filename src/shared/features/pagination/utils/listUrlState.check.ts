// Runnable self-check for the list-URL codec (no test framework — the repo has none).
// Run: `bun src/shared/features/pagination/utils/listUrlState.check.ts`.
//
// Covers the two rules that are easy to break by hand and silent when broken: position params
// dropping on a filter change, and `?page=1` never being emitted.

import assert from 'node:assert/strict';
import {
	MAX_CURSOR_STACK,
	currentCursor,
	cursorPage,
	hasActiveFilters,
	listHref,
	popCursorHref,
	pushCursorHref,
	readPage,
	readSort
} from './listUrlState.ts';

const at = (search: string) => new URL(`https://x/list${search}`);

// ── readPage: forgiving, never throws ────────────────────────────────────────
assert.equal(readPage(at('')), 1);
assert.equal(readPage(at('?page=3')), 3);
assert.equal(readPage(at('?page=abc')), 1, 'junk degrades to page 1');
assert.equal(readPage(at('?page=-2')), 1, 'negatives degrade to page 1');
assert.equal(readPage(at('?page=3.7')), 3, 'floats floor');

// ── listHref: page 1 is the bare URL ─────────────────────────────────────────
assert.equal(listHref(at(''), { page: 1 }), '/list', 'page=1 is never emitted');
assert.equal(listHref(at('?page=4'), { page: 1 }), '/list');
assert.equal(listHref(at(''), { page: 3 }), '/list?page=3');
assert.equal(listHref(at('?role=admin'), { page: 2 }), '/list?role=admin&page=2');

// ── listHref: changing WHAT is listed drops WHERE you are in it ──────────────
assert.equal(
	listHref(at('?page=7&role=admin'), { role: 'user' }),
	'/list?role=user',
	'a filter change the patch names drops the page'
);
assert.equal(
	listHref(at('?page=7&cs=abc&role=admin'), { role: 'user' }),
	'/list?role=user',
	'…and drops the cursor trail, which was computed against the old filters'
);
assert.equal(
	listHref(at('?page=7&role=admin'), { page: 8 }),
	'/list?page=8&role=admin',
	'but an explicit page in the patch is kept (in its existing position)'
);

// ── listHref: empty values delete, foreign params survive ────────────────────
assert.equal(listHref(at('?role=admin'), { role: '' }), '/list');
assert.equal(listHref(at('?role=admin'), { role: null }), '/list');
assert.equal(
	listHref(at('?utm_source=mail&role=admin'), { role: 'user' }),
	'/list?utm_source=mail&role=user',
	'params this module does not own are preserved'
);

// ── readSort: allow-list bound ───────────────────────────────────────────────
assert.deepEqual(readSort(at('?sort=name:asc'), ['name']), { column: 'name', direction: 'asc' });
assert.deepEqual(readSort(at('?sort=name:sideways'), ['name']), {}, 'bad direction → no sort');
assert.deepEqual(readSort(at('?sort=passwordHash:asc'), ['name']), {}, 'unlisted column → no sort');
assert.deepEqual(readSort(at(''), ['name']), {});

// ── cursor trail ─────────────────────────────────────────────────────────────
assert.equal(currentCursor(at('')), null, 'page one has no cursor');
assert.equal(cursorPage(at('')), 1);
assert.equal(pushCursorHref(at(''), 'c1'), '/list?cs=c1');
assert.equal(currentCursor(at('?cs=c1~c2')), 'c2', 'newest entry is the current page');
assert.equal(cursorPage(at('?cs=c1~c2')), 3, 'two hops deep = page 3');
assert.equal(popCursorHref(at('?cs=c1~c2')), '/list?cs=c1');
assert.equal(popCursorHref(at('?cs=c1')), '/list', 'popping the last hop clears the param');
assert.equal(pushCursorHref(at('?cs=c1'), null), '/list', 'no next cursor = no trail');

const deep = at(`?cs=${Array.from({ length: MAX_CURSOR_STACK }, (_, i) => `c${i}`).join('~')}`);
assert.equal(
	new URL(`https://x${pushCursorHref(deep, 'overflow')}`).searchParams.get('cs')?.split('~').length,
	MAX_CURSOR_STACK,
	'the trail is capped — the oldest hop is dropped, not appended past the limit'
);

// ── hasActiveFilters: pagination is NOT a filter ─────────────────────────────
assert.equal(hasActiveFilters(at('')), false);
assert.equal(hasActiveFilters(at('?page=9')), false, 'being on page 9 is not a filter');
assert.equal(hasActiveFilters(at('?cs=c1')), false, 'a cursor is a bookmark, not a filter');
assert.equal(hasActiveFilters(at('?role=admin')), true);
assert.equal(hasActiveFilters(at('?role=')), false, 'an empty value narrows nothing');

console.log('listUrlState.check.ts OK');
