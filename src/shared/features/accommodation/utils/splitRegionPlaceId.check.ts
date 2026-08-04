/**
 * `splitRegionPlaceId` must reproduce the old in-memory match EXACTLY, because the old test
 * was what search behaviour was defined by:
 *
 *     apartment.placeId?.split(' ').includes(pickedPlaceId)
 *
 * The split now happens at write time and the match at the index, so a divergence here does
 * not throw — it makes listings quietly stop appearing for a search that used to find them.
 * Hence the property check below: for every listing/pick pair, indexed matching and the old
 * in-memory matching must agree.
 *
 * ponytail: plain asserts, no test framework — run it with
 * `bun src/shared/features/accommodation/utils/splitRegionPlaceId.check.ts`
 */
import { strict as assert } from 'node:assert';

import { splitRegionPlaceId } from './splitRegionPlaceId';

const BELGRADE = 'ChIJ_Belgrade';
const SERBIA = 'ChIJ_Serbia';
const ZAGREB = 'ChIJ_Zagreb';

// --- Normal case: city first, country second.
assert.deepEqual(splitRegionPlaceId(`${BELGRADE} ${SERBIA}`), {
	cityPlaceId: BELGRADE,
	countryPlaceId: SERBIA
});

// --- Unsplit fallback (`resolveMergedRegionPlaceId` when neither region resolved): ambiguous,
//     so it must match whether the searcher picked it as a city or as a country.
assert.deepEqual(splitRegionPlaceId(BELGRADE), {
	cityPlaceId: BELGRADE,
	countryPlaceId: BELGRADE
});

// --- Nothing to split.
assert.deepEqual(splitRegionPlaceId(undefined), {
	cityPlaceId: undefined,
	countryPlaceId: undefined
});
assert.deepEqual(splitRegionPlaceId(''), { cityPlaceId: undefined, countryPlaceId: undefined });
assert.deepEqual(splitRegionPlaceId('   '), { cityPlaceId: undefined, countryPlaceId: undefined });

// --- Sloppy whitespace must not produce empty ids that would match nothing.
assert.deepEqual(splitRegionPlaceId(`  ${BELGRADE}   ${SERBIA}  `), {
	cityPlaceId: BELGRADE,
	countryPlaceId: SERBIA
});

// --- THE property: indexed matching agrees with the old in-memory test, for every pair.
const storedValues = [
	`${BELGRADE} ${SERBIA}`,
	`${ZAGREB} ${SERBIA}`,
	BELGRADE,
	SERBIA,
	'',
	undefined
];
const pickedValues = [BELGRADE, SERBIA, ZAGREB, 'ChIJ_Nowhere'];

for (const stored of storedValues) {
	const { cityPlaceId, countryPlaceId } = splitRegionPlaceId(stored);

	for (const picked of pickedValues) {
		// What the query does now: two exact index reads, unioned.
		const indexed = cityPlaceId === picked || countryPlaceId === picked;
		// What the query used to do, in memory.
		const legacy = stored?.split(' ').includes(picked) ?? false;

		assert.equal(
			indexed,
			legacy,
			`match diverged for stored="${stored}" picked="${picked}" — indexed=${indexed} legacy=${legacy}`
		);
	}
}

console.log('splitRegionPlaceId.check.ts — all assertions passed');
