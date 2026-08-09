/**
 * Self-check for the `/search` visibility rule. The filters are MINIMUMS, so an off-by-one here
 * hides listings that genuinely match — silently, and only for the people using that filter.
 *
 * ponytail: plain asserts, no test framework — run it with
 * `bun src/shared/features/accommodation/utils/matchesSearchFilters.check.ts`
 */
import { strict as assert } from 'node:assert';

import { matchesSearchFilters } from './matchesSearchFilters';

const listing = {
	coordinates: { lat: 44.81, lng: 20.46 },
	images: [{ key: 'a' }],
	bedrooms: 2,
	bathrooms: 1,
	maxGuests: 4
};

// --- No filters: a renderable listing is always in ---
assert.equal(matchesSearchFilters(listing, {}), true, 'no filters');

// --- Hard requirements: nothing to place, nothing to draw ---
assert.equal(
	matchesSearchFilters({ ...listing, coordinates: undefined }, {}),
	false,
	'no coordinates: no marker'
);
assert.equal(matchesSearchFilters({ ...listing, images: [] }, {}), false, 'no photo: no card');

// --- Minimums are inclusive at the boundary (the bug that hides exact matches) ---
assert.equal(matchesSearchFilters(listing, { bedrooms: 2 }), true, '2 bedrooms matches "2+"');
assert.equal(matchesSearchFilters(listing, { bedrooms: 3 }), false, '2 bedrooms fails "3+"');
assert.equal(matchesSearchFilters(listing, { bedrooms: 1 }), true, '2 bedrooms matches "1+"');
assert.equal(matchesSearchFilters(listing, { bathrooms: 1 }), true, '1 bath matches "1+"');
assert.equal(matchesSearchFilters(listing, { bathrooms: 2 }), false, '1 bath fails "2+"');
assert.equal(matchesSearchFilters(listing, { guests: 4 }), true, 'sleeps 4 matches "4+"');
assert.equal(matchesSearchFilters(listing, { guests: 5 }), false, 'sleeps 4 fails "5+"');

// --- Every filter must hold, not just one ---
assert.equal(
	matchesSearchFilters(listing, { bedrooms: 2, bathrooms: 1, guests: 4 }),
	true,
	'all three at the boundary'
);
assert.equal(
	matchesSearchFilters(listing, { bedrooms: 2, bathrooms: 3, guests: 4 }),
	false,
	'one failing filter rejects'
);

// --- Zero is a real filter value, not "unset" ---
assert.equal(
	matchesSearchFilters({ ...listing, bathrooms: 0 }, { bathrooms: 1 }),
	false,
	'0 baths fails "1+"'
);
assert.equal(
	matchesSearchFilters({ ...listing, bathrooms: 0 }, { bathrooms: 0 }),
	true,
	'0 baths matches "0+"'
);

console.log('matchesSearchFilters: all checks passed');
