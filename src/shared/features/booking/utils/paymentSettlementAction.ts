// TYPES
import type { typesPaymentStatus } from '@/shared/features/booking/types/bookingTypes';

/** What the money side must do when a booking ends. */
export type typesPaymentSettlementAction = 'release' | 'refund' | 'none';

/**
 * PaymentsSystemDesign.md §4's matrix as a pure decision — the ONLY place the
 * "what happens to the money" question is answered.
 *
 * Pure and shared so the rule can be checked without a provider or a database
 * (`paymentSettlementAction.check.ts`) and so the UI can state the same consequence the
 * mutation will enact. `settleBookingPayment` performs it; this decides it.
 *
 * **The matrix is closed** (§ FOR LLMs 4): a refund path not in the table does not exist.
 * Add a row to the design before adding a branch here.
 *
 * @param keepMoney the late-cancellation case ONLY — a guest cancelling inside the free
 *   window forfeits the payment and the host keeps it, so nothing moves. Never true for a
 *   host or admin cancel, which are always full refunds whatever the window.
 */
export function paymentSettlementAction(
	paymentStatus: typesPaymentStatus,
	keepMoney = false
): typesPaymentSettlementAction {
	switch (paymentStatus) {
		// Hold placed, no money moved — withdraw / decline / expire / any cancel releases it.
		case 'authorized':
			return 'release';
		// Captured. Full refund unless this is the late cancel the host is compensated for.
		case 'paid':
			return keepMoney ? 'none' : 'refund';
		// `on_arrival` — cash never enters the payments document at all.
		// `awaiting`    — the hold expires with the checkout session; the row is reaped.
		// `released` / `refunded` — already settled; re-settling would be a double refund.
		default:
			return 'none';
	}
}
