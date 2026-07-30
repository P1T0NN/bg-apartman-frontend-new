// CONFIG
import { MS_PER_DAY } from '@/shared/config';

/**
 * Where a listing's paid period ends after a successful listing-fee payment
 * (AccommodationsSystemDesign.md §8, §11).
 *
 * The rule is continuity, not a reset — a bought period always starts where the previous
 * one stopped, so paying does not depend on WHEN you pay:
 *
 * | situation                          | base       | why                                          |
 * | ---------------------------------- | ---------- | -------------------------------------------- |
 * | first payment (no expiry yet)      | now        | nothing to extend                            |
 * | early renewal (expiry in future)   | expiry     | §8 — "early renewal extends rather than resets" |
 * | late renewal, still inside grace   | expiry     | §11 — "extends from expiry (not from now)"   |
 * | lapsed past grace (already expired)| now        | dead time isn't bought back                  |
 *
 * §8 states the formula as `max(now, currentExpiry) + PERIOD_DAYS`; §11's grace row is the
 * refinement, and this function is both. Within grace the listing is still published, so
 * extending from `now` would hand out the grace days free; extending from `expiry` means a
 * host who pays two days late gets exactly the coverage they paid for — no more, no less.
 *
 * Pure and shared so the host renewal, the admin manual stamp, and the mode-flip backfill
 * cannot each grow their own arithmetic (§5's "one composer" rule, applied to time).
 */
export function nextSubscriptionExpiry(
	now: number,
	currentExpiry: number | undefined,
	periodDays: number,
	graceDays: number
): number {
	const withinGrace =
		currentExpiry !== undefined && currentExpiry + graceDays * MS_PER_DAY >= now;

	const base = withinGrace ? currentExpiry : now;
	return base + periodDays * MS_PER_DAY;
}
