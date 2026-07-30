/**
 * Self-check for PaymentsSystemDesign.md §4's matrix — the rule that decides whether a
 * guest gets their money back. Every row of the doc's table appears below; a wrong answer
 * here is either a guest charged for a stay that didn't happen or a host paid for one, so
 * it gets a runnable check.
 *
 * ponytail: plain asserts, no test framework — run it with `bun src/shared/features/booking/utils/paymentSettlementAction.check.ts`
 */
import { strict as assert } from 'node:assert';

import { paymentSettlementAction } from './paymentSettlementAction';

// --- Withdraw / decline / expire of `authorized` → release the hold, no money moved.
assert.equal(paymentSettlementAction('authorized'), 'release');
// A host or admin cancelling an authorized request releases it too — same row.
assert.equal(paymentSettlementAction('authorized', false), 'release');

// --- Guest cancels ON TIME (`paid`) → full refund.
assert.equal(paymentSettlementAction('paid'), 'refund');

// --- Guest cancels LATE (`paid`) → nothing; the host keeps it and the earnings row stays
//     owed, transferring on the normal sweep. THE one case where money doesn't come back.
assert.equal(paymentSettlementAction('paid', true), 'none');

// --- `keepMoney` is meaningless for a hold: there is nothing to keep.
assert.equal(paymentSettlementAction('authorized', true), 'release');

// --- Cash never enters the payments document.
assert.equal(paymentSettlementAction('on_arrival'), 'none');
assert.equal(paymentSettlementAction('on_arrival', true), 'none');

// --- An abandoned/open checkout: the hold dies with the session, the row is reaped.
assert.equal(paymentSettlementAction('awaiting'), 'none');

// --- Already settled. Re-settling would double-refund or double-release.
assert.equal(paymentSettlementAction('released'), 'none');
assert.equal(paymentSettlementAction('refunded'), 'none');

console.log('paymentSettlementAction: all checks passed');
