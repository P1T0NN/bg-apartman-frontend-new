/**
 * Self-check for the cancellation windows (BookingSystemDesign.md §4/§11) — the boundaries
 * a guest's refund, the cash cutoff, the host's stay-confirmation unlock, and the
 * `lateCancellation` record hang off. Getting the edges wrong either blocks a legitimate
 * cancel or silently forfeits a refundable one.
 *
 * ponytail: plain asserts, no test framework — run it with `bun src/shared/features/booking/utils/cancellationWindow.check.ts`
 */
import { strict as assert } from 'node:assert';

import { STAY_CONFIRMATION_UNLOCK_MS } from '@/shared/config';
import {
	guestMayCancelConfirmed,
	hostMayCancelConfirmed,
	isLateCancellation
} from './guestMayCancelConfirmedBooking';

const TODAY = '2026-06-10';
const NOW = Date.parse('2026-06-10T12:00:00Z');
const policy = { freeCancelDays: 7, hostResponseHours: 48 };

// ============================== GUEST ==============================

// --- CASH: closes at the free-cancel cutoff — the booking becomes a commitment ---
assert.equal(guestMayCancelConfirmed('2026-06-20', TODAY, policy, 'cash'), true, 'well ahead');
assert.equal(guestMayCancelConfirmed('2026-06-17', TODAY, policy, 'cash'), true, 'exactly 7 days');
assert.equal(guestMayCancelConfirmed('2026-06-16', TODAY, policy, 'cash'), false, '6 days: closed');
assert.equal(
	guestMayCancelConfirmed('2026-06-11', TODAY, policy, 'cash'),
	false,
	'tomorrow: closed'
);

// --- ONLINE: open until the day before check-in (forfeits refund inside the window) ---
assert.equal(guestMayCancelConfirmed('2026-06-20', TODAY, policy, 'online'), true, 'well ahead');
assert.equal(guestMayCancelConfirmed('2026-06-16', TODAY, policy, 'online'), true, 'late but open');
assert.equal(
	guestMayCancelConfirmed('2026-06-11', TODAY, policy, 'online'),
	true,
	'tomorrow: open'
);
assert.equal(
	guestMayCancelConfirmed('2026-06-10', TODAY, policy, 'online'),
	false,
	'check-in day closes self-serve'
);

// --- late or not (online only in practice): measured against the booking's own snapshot ---
assert.equal(isLateCancellation('2026-06-17', TODAY, policy), false, 'exactly 7 days is on time');
assert.equal(isLateCancellation('2026-06-16', TODAY, policy), true, '6 days is late');
assert.equal(isLateCancellation('2026-06-11', TODAY, policy), true, 'tomorrow is late');

// A booking created under a different policy keeps ITS window, not today's config.
const legacyPolicy = { freeCancelDays: 14, hostResponseHours: 48 };
assert.equal(
	guestMayCancelConfirmed('2026-06-20', TODAY, legacyPolicy, 'cash'),
	false,
	'10 days < legacy 14-day window'
);
assert.equal(isLateCancellation('2026-06-25', TODAY, legacyPolicy), false, '15 days >= 14');

// ============================== HOST ==============================

const host = (
	checkInDate: string,
	paymentMethod: 'cash' | 'online',
	confirmation: { requestedAt?: number; confirmedAt?: number } = {}
) =>
	hostMayCancelConfirmed(
		{
			checkInDate,
			policy,
			paymentMethod,
			stayConfirmationRequestedAt: confirmation.requestedAt,
			stayConfirmedAt: confirmation.confirmedAt
		},
		TODAY,
		NOW
	);

// --- CASH: outside the window free; inside it ONLY with a provably ignored request ---
assert.equal(host('2026-06-20', 'cash'), true, 'well ahead: free');
assert.equal(host('2026-06-17', 'cash'), true, 'exactly 7 days: free');
assert.equal(host('2026-06-16', 'cash'), false, 'inside window, no request: locked');
assert.equal(
	host('2026-06-16', 'cash', { requestedAt: NOW - STAY_CONFIRMATION_UNLOCK_MS + 60_000 }),
	false,
	'request too fresh: still locked'
);
assert.equal(
	host('2026-06-16', 'cash', { requestedAt: NOW - STAY_CONFIRMATION_UNLOCK_MS - 60_000 }),
	true,
	'request ignored past the unlock window: open'
);
assert.equal(
	host('2026-06-16', 'cash', {
		requestedAt: NOW - STAY_CONFIRMATION_UNLOCK_MS - 60_000,
		confirmedAt: NOW - 30_000
	}),
	false,
	'guest confirmed after the request: re-locked'
);
assert.equal(
	host('2026-06-16', 'cash', {
		requestedAt: NOW - STAY_CONFIRMATION_UNLOCK_MS - 60_000,
		confirmedAt: NOW - 2 * STAY_CONFIRMATION_UNLOCK_MS
	}),
	true,
	'a confirm predating the latest request is not an answer'
);
assert.equal(
	host('2026-06-10', 'cash', { requestedAt: NOW - 3 * STAY_CONFIRMATION_UNLOCK_MS }),
	false,
	'check-in day: closed regardless of any request'
);

// --- ONLINE: closes at the cutoff — no request can unlock a paid stay ---
assert.equal(host('2026-06-20', 'online'), true, 'well ahead');
assert.equal(host('2026-06-17', 'online'), true, 'exactly 7 days');
assert.equal(host('2026-06-16', 'online'), false, '6 days: ironclad');
assert.equal(
	host('2026-06-16', 'online', { requestedAt: NOW - 3 * STAY_CONFIRMATION_UNLOCK_MS }),
	false,
	'ignored request does NOT unlock an online cancel — money already proves intent'
);

// The symmetry (§4): inside the window each side's cancel right is locked — the guest's on
// cash, the host's on online — and the cash host lock opens only with PROOF (§11).
assert.equal(guestMayCancelConfirmed('2026-06-14', TODAY, policy, 'cash'), false);
assert.equal(host('2026-06-14', 'cash'), false);
assert.equal(guestMayCancelConfirmed('2026-06-14', TODAY, policy, 'online'), true);
assert.equal(host('2026-06-14', 'online'), false);

console.log('cancellationWindow: all checks passed');
