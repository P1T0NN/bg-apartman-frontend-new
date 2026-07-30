// LIBRARIES
import { v } from 'convex/values';

/**
 * The eight booking states (BookingSystemDesign.md §2). Five are terminal —
 * `checked_out`, `declined`, `auto_declined`, `withdrawn`, `cancelled` — and nothing
 * transitions out of a terminal state, including admins.
 *
 * `withdrawn` is deliberately NOT `cancelled` with a flag: a guest pulling a request the
 * host never answered is a non-event, while cancelling a confirmed stay is a real one.
 * Collapsing them poisons every list, count, and analytics read downstream.
 */
export const bookingStatus = v.union(
	v.literal('pending'),
	v.literal('confirmed'),
	v.literal('checked_in'),
	v.literal('checked_out'),
	v.literal('declined'),
	v.literal('auto_declined'),
	v.literal('withdrawn'),
	v.literal('cancelled')
);

/**
 * Where the MONEY is — deliberately decoupled from `bookingStatus`, which says where the
 * STAY is (BookingSystemDesign.md §5, PaymentsSystemDesign.md §3).
 *
 * - `on_arrival` — cash. Terminal for cash: the platform never witnesses the handover.
 * - `awaiting`   — online checkout open, nothing confirmed. The booking is invisible at
 *                  this point: no emails, no host clock, no queue entry.
 * - `authorized` — card hold placed, no money moved.
 * - `paid`       — captured.
 * - `released`   — hold released, no money ever moved.
 * - `refunded`   — captured then returned.
 */
export const paymentStatus = v.union(
	v.literal('on_arrival'),
	v.literal('awaiting'),
	v.literal('authorized'),
	v.literal('paid'),
	v.literal('released'),
	v.literal('refunded')
);

/**
 * Where one captured booking's money stands (PaymentsSystemDesign.md §5).
 *
 * - `held`        — captured by the platform, owed to the host, not yet transferred.
 * - `transferred` — paid out; `transferRef` / `transferredAt` stamped.
 * - `returned`    — the booking was refunded, so nothing is owed.
 *
 * A row only becomes transferable when the booking is terminal WITH money owed
 * (`checked_out`, or `cancelled` with `lateCancellation`) and the host is payable. Paying
 * earlier would create a clawback state the design excludes structurally.
 */
export const bookingEarningStatus = v.union(
	v.literal('held'),
	v.literal('transferred'),
	v.literal('returned')
);

/**
 * A money operation that failed and needs a human (PaymentsSystemDesign.md §4/§5/§6).
 *
 * The design's failure pattern is "state unchanged + admin flag + reconciliation
 * re-surface" — NOT retry queues, backoff loops or saga states (§ FOR LLMs 6). A flagged
 * row keeps its last true payment state; the flag says only that reality and our record
 * may have diverged. Cleared by the admin who finishes the job.
 */
export const paymentFlag = v.union(
	v.literal('capture_failed'),
	v.literal('refund_failed'),
	v.literal('release_failed'),
	v.literal('transfer_failed'),
	/** Reconciliation found provider truth ≠ our row, or a state stuck past its window. */
	v.literal('reconcile_mismatch')
);

/** Who ended the booking. `system` = cron (expiry / lost overlap race). */
export const cancelledBy = v.union(
	v.literal('guest'),
	v.literal('host'),
	v.literal('system'),
	v.literal('admin')
);

/**
 * The policy this booking lives under, frozen at creation (BookingSystemDesign.md §7).
 * Decisions about an existing booking read THIS, never live config — changing platform
 * policy must never retroactively move a live booking's cancellation window.
 */
export const bookingPolicy = v.object({
	freeCancelDays: v.number(),
	hostResponseHours: v.number()
});

// check_in / check_out are cron-driven, not host actions — see the booking-lifecycle cron.
export const bookingAction = v.union(
	v.literal('confirm'),
	v.literal('decline'),
	v.literal('cancel')
);

export const guestBookingAction = v.union(v.literal('withdraw'), v.literal('cancel'));
