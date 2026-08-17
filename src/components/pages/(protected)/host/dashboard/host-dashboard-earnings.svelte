<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';

	// UTILS
	import { formatCurrency } from '@/utils/formatters';

	// TYPES
	import type { HostEarningsCard } from '@/convex/pages/host/dashboard/types/hostDashboardTypes';

	// LUCIDE ICONS
	import WalletIcon from '@lucide/svelte/icons/wallet';

	/**
	 * The earnings summary card — one card, zero modals, never blocks any host action.
	 * Shows the held balance and its state. Payout onboarding is inert (the payment engine
	 * is stripped), so there is no "add payout details" step to open.
	 */
	let { data }: { data: HostEarningsCard | null | undefined } = $props();
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
		</div>
	</Card>
{/if}
