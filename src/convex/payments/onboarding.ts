// LIBRARIES
import { v } from 'convex/values';
import { action, internalMutation, internalQuery } from '@/convex/_generated/server';

// UTILS
import { internal } from '@/convex/_generated/api';
import { authComponent } from '@/convex/auth/auth';
import { requireAuthUserId } from '@/convex/auth/helpers/requireAuthUserId';
import { paymentsAdapter, onlinePaymentsEnabled } from '@/convex/payments/adapter';

// SCHEMAS
import { mutationResultData } from '@/convex/schemas/schemas';

// TYPES
import type { MutationCtx } from '@/convex/_generated/server';

/**
 * Progressive host onboarding (PaymentsSystemDesign.md §2) — the psychology, made
 * mechanical. The stage table there is the COMPLETE list of asks; never add a
 * "complete your payout setup" prompt, modal or gate anywhere else (§ FOR LLMs 3).
 *
 * | stage | trigger                       | the ask                          |
 * | ----- | ----------------------------- | -------------------------------- |
 * | 2     | toggles `online` on a listing | nothing — silent, one sentence   |
 * | 3     | first capture (host earned)   | "add payout details to get €X"   |
 * | 4     | provider confirms transfers   | nothing, ever again              |
 */

/** The host's country for the recipient account. Belgrade-scale platform, Serbian hosts. */
const DEFAULT_HOST_COUNTRY = 'RS';

/**
 * Stage 2: create the recipient account SILENTLY when a host first enables online payments
 * on a listing — with only what we already know (email, country). No forms, no redirect,
 * one passive sentence in the UI.
 *
 * Deliberately best-effort: if creation fails **the toggle still succeeds** and the account
 * is created lazily at stage 3, when the onboarding link actually needs one (§2, §11). That
 * is also why this never throws — a payment-provider hiccup must not block a host from
 * editing their listing.
 */
export async function ensureHostPayoutAccount(ctx: MutationCtx, hostId: string): Promise<void> {
	if (!onlinePaymentsEnabled()) return;

	const existing = await ctx.db
		.query('hostPayoutAccounts')
		.withIndex('by_host', (q) => q.eq('hostId', hostId))
		.first();
	if (existing) return;

	try {
		const host = await authComponent.getAnyUserById(ctx, hostId);
		const email = host?.email?.trim();
		if (!email) return;

		const providerAccountId = await paymentsAdapter.createRecipientAccount({
			hostId,
			email,
			country: DEFAULT_HOST_COUNTRY
		});

		await ctx.db.insert('hostPayoutAccounts', {
			hostId,
			providerAccountId,
			// Maintained EXCLUSIVELY by account webhooks from here on — never inferred (§5).
			transfersActive: false,
			updatedAt: Date.now()
		});
	} catch {
		// Silent by design — retried at stage 3. See the doc comment above.
	}
}

/** Internal twin of {@link ensureHostPayoutAccount} for the stage-3 lazy retry. */
export const createPayoutAccountForHost = internalMutation({
	args: { hostId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		await ensureHostPayoutAccount(ctx, args.hostId);
		return null;
	}
});

export const fetchPayoutAccount = internalQuery({
	args: { hostId: v.string() },
	handler: async (ctx, args) => {
		const account = await ctx.db
			.query('hostPayoutAccounts')
			.withIndex('by_host', (q) => q.eq('hostId', args.hostId))
			.first();
		return account ? { providerAccountId: account.providerAccountId } : null;
	}
});

/**
 * Stage 3's ONE button: mint a provider-hosted onboarding link for the signed-in host.
 *
 * An action because both ops are network I/O. The provider owns the whole flow — we never
 * build KYC forms ourselves, and the copy around this button says "add your payout details
 * to receive €X", never "verify your identity" or "compliance" (§2, §12).
 *
 * If stage 2's silent creation failed, this is where it retries (§11).
 */
export const startPayoutOnboarding = action({
	args: {},
	returns: mutationResultData(v.object({ onboardingUrl: v.string() })),
	handler: async (ctx) => {
		if (!onlinePaymentsEnabled()) {
			return { success: false, message: { key: 'GenericMessages.PAYOUTS_UNAVAILABLE' } };
		}

		const hostId = await requireAuthUserId(ctx);

		let account = await ctx.runQuery(internal.payments.onboarding.fetchPayoutAccount, { hostId });
		if (!account) {
			await ctx.runMutation(internal.payments.onboarding.createPayoutAccountForHost, { hostId });
			account = await ctx.runQuery(internal.payments.onboarding.fetchPayoutAccount, { hostId });
		}
		if (!account) {
			return { success: false, message: { key: 'GenericMessages.PAYOUTS_UNAVAILABLE' } };
		}

		try {
			const onboardingUrl = await paymentsAdapter.onboardingLink(account.providerAccountId);
			return {
				success: true,
				message: { key: 'GenericMessages.PAYOUT_ONBOARDING_READY' },
				data: { onboardingUrl }
			};
		} catch {
			return { success: false, message: { key: 'GenericMessages.PAYOUTS_UNAVAILABLE' } };
		}
	}
});
