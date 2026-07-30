// SEND
import { sendEmail, hostDashboardUrl, type EmailCtx } from './resend';

// TEMPLATES
import { hostEarningsHeldTemplate } from './templates/hostEarningsHeld/hostEarningsHeldTemplate';

type SendHostEarningsHeldEmailInput = {
	locale: string;
	hostName: string;
	hostEmail: string;
	earnedEuros: number;
	heldEuros: number;
};

/**
 * "You earned €X — add your payout details to receive it" (PaymentsSystemDesign.md §2,
 * stage 3). Sent on each capture while the host is not yet payable, and never again once
 * the provider confirms transfers (stage 4). See {@link recordCapturedEarnings}.
 */
export async function sendHostEarningsHeldEmail(
	ctx: EmailCtx,
	input: SendHostEarningsHeldEmailInput
): Promise<void> {
	const content = hostEarningsHeldTemplate({
		locale: input.locale,
		hostName: input.hostName,
		earnedEuros: input.earnedEuros,
		heldEuros: input.heldEuros,
		// The card on the dashboard is the only place the ask lives — the email points at it.
		dashboardUrl: hostDashboardUrl()
	});

	await sendEmail(ctx, input.hostEmail, content);
}
