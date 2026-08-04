/**
 * Self-check for the page-number window. An off-by-one here either hides the last page from
 * a crawler or renders a link to a page that does not exist.
 *
 * ponytail: plain asserts, no test framework — run it with
 * `bun src/components/ui/paginated-data/paginatedDataUtils.check.ts`
 */
import { strict as assert } from 'node:assert';

import { pageWindow } from './paginatedDataUtils';

assert.deepEqual(pageWindow(1, 0), [], 'no pages');
assert.deepEqual(pageWindow(1, 1), [1], 'single page');
assert.deepEqual(pageWindow(3, 5), [1, 2, 3, 4, 5], 'contiguous — no gaps');
assert.deepEqual(pageWindow(1, 5), [1, 2, 'gap', 5], 'first page elides the tail');
assert.deepEqual(pageWindow(10, 10), [1, 'gap', 9, 10], 'last page elides the head');
assert.deepEqual(pageWindow(5, 10), [1, 'gap', 4, 5, 6, 'gap', 10], 'middle elides both sides');
assert.deepEqual(pageWindow(99, 5), [1, 'gap', 4, 5], 'out-of-range current clamps to total');
assert.deepEqual(pageWindow(5, 10, 2), [1, 'gap', 3, 4, 5, 6, 7, 'gap', 10], 'wider span');

console.log('paginatedDataUtils.check.ts OK');
