/**
 * Self-check for the listing-fee renewal arithmetic — the rule that decides how much time
 * a host's money buys (AccommodationsSystemDesign.md §8, §11). Getting it wrong either
 * gives away free months or silently shortens a period the host paid for, and neither is
 * visible until a listing expires at the wrong moment.
 *
 * ponytail: plain asserts, no test framework — run it with `bun src/shared/features/accommodation/utils/nextSubscriptionExpiry.check.ts`
 */
import { strict as assert } from 'node:assert';

import { MS_PER_DAY } from '../../../config';
import { nextSubscriptionExpiry } from './nextSubscriptionExpiry';

const PERIOD = 90;
const GRACE = 3;
const now = Date.parse('2026-07-01T12:00:00Z');
const days = (n: number) => n * MS_PER_DAY;

const next = (currentExpiry: number | undefined) =>
	nextSubscriptionExpiry(now, currentExpiry, PERIOD, GRACE);

// --- First payment: nothing to extend, the period starts today.
assert.equal(next(undefined), now + days(PERIOD));

// --- Early renewal: extends from the existing expiry, never resets it. A host paying 10
//     days early keeps those 10 days — that's the whole point of §8's wording.
assert.equal(next(now + days(10)), now + days(10 + PERIOD));

// --- Renewing on the exact expiry moment is the clean seam between the two branches.
assert.equal(next(now), now + days(PERIOD));

// --- Late renewal INSIDE grace: still extends from expiry (§11). The host gets exactly
//     the coverage they paid for — the grace days are not a free bonus.
assert.equal(next(now - days(1)), now - days(1) + days(PERIOD));
assert.equal(next(now - days(GRACE)), now - days(GRACE) + days(PERIOD));

// --- One day past grace (the listing is `expired` by now): a fresh period from today.
//     Dead time is not bought back.
assert.equal(next(now - days(GRACE + 1)), now + days(PERIOD));

// --- Long-lapsed listing renewing months later: same fresh period, no retroactive credit.
assert.equal(next(now - days(400)), now + days(PERIOD));

// --- Renewal is always forward in time, whatever the input.
for (const expiry of [undefined, now - days(400), now - days(1), now, now + days(50)]) {
	assert.ok(next(expiry) > now, `expiry ${String(expiry)} must extend past now`);
}

console.log('nextSubscriptionExpiry: all checks passed');
