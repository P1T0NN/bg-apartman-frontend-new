<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { safeAction } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';
	import { formatCurrency } from '@/utils/formatters';

	// TYPES
	import type { HostEarningsCard } from '@/convex/pages/host/dashboard/types/hostDashboardTypes';

	// LUCIDE ICONS
	import { Loader } from '@lucide/svelte';
	import WalletIcon from '@lucide/svelte/icons/wallet';

	/**
	 * Stage 3 / 4 of host onboarding (PaymentsSystemDesign.md §2) — ONE persistent card,
	 * zero modals, zero interstitials, and it never blocks any host action.
	 *
	 * Before the provider confirms transfers it shows the held balance and one button. After,
	 * it is just an earnings summary and asks for nothing, ever again. The copy says "add
	 * your payout details to receive €X" — never "verify your identity", "KYC" or
	 * "compliance"; those steps live inside the provider-hosted flow this button opens.
	 *
	 * A host can decline forever: the money holds indefinitely and nothing expires.
	 */
	let { data }: { data: HostEarningsCard | null | undefined } = $props();

	const convex = useConvexClient();

	let isPending = $state(false);

	async function startOnboarding() {
		isPending = true;
		try {
			const result = await safeAction(convex, api.payments.onboarding.startPayoutOnboarding, {});
			if (!toastResult(result)) return;
			// The provider owns the flow end to end; we hand the host over and get them back
			// via its return link.
			if (result?.data?.onboardingUrl) window.location.href = result.data.onboardingUrl;
		} finally {
			isPending = false;
		}
	}
</script>

{#if data}
	<Card class="gap-0 p-4 sm:p-5">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-start gap-3">
				<span
					class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
				>
					<WalletIcon class="size-5" aria-hidden="true" />
				</span>

				<div class="min-w-0">
					<h2 class="text-base font-semibold tracking-tight">
						{formatCurrency(data.heldEuros)}
						{data.payable ? m['HostDashboardPage.HostDashboardEarnings.onTheWay']() : m['HostDashboardPage.HostDashboardEarnings.waitingForYou']()}
					</h2>
					<p class="text-xs text-muted-foreground">
						{#if data.payable}
							{m['HostDashboardPage.HostDashboardEarnings.payoutSet']()}
						{:else}
							{m['HostDashboardPage.HostDashboardEarnings.payoutPending']()}
						{/if}
					</p>
				</div>
			</div>

			{#if !data.payable}
				<Button onclick={startOnboarding} disabled={isPending} class="shrink-0 self-start">
					{#if isPending}
						<Loader class="h-3 w-3 animate-spin" />
					{/if}
					{m['HostDashboardPage.HostDashboardEarnings.addPayoutDetails']()}
				</Button>
			{/if}
		</div>
	</Card>
{/if}
