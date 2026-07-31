<script lang="ts">
	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';
	import { cn } from '@/utils/utils.js';

	// UTILS
	import { formatCurrency } from '@/utils/formatters';

	// TYPES
	import type { AdminDashboardPage } from '@/convex/pages/admin/dashboard/types/adminDashboardTypes';

	/**
	 * Band 3a — the platform's headline numbers, set as a ledger rather than a stat-card
	 * grid, same reasoning and treatment as the host dashboard's ledger (DESIGN.md bans the
	 * big-number stat strip by name). Left block: this month's money-and-demand. Right
	 * block: the platform's standing stock. No delta arrows in v1 — deltas need a
	 * comparison-period decision (AdminDashboardPageSystemDesign.md §8).
	 */
	let { data }: { data: AdminDashboardPage['platform'] } = $props();

	type LedgerRow = { label: string; value: string; lead?: boolean };

	const thisMonth = $derived<LedgerRow[]>([
		{ label: 'Revenue', value: formatCurrency(data.revenueThisMonth), lead: true },
		{ label: 'Bookings', value: String(data.bookingsThisMonth) }
	]);

	const platform = $derived<LedgerRow[]>([
		{ label: 'Users', value: String(data.usersTotal), lead: true },
		{ label: 'Published listings', value: String(data.publishedListings) }
	]);
</script>

{#snippet ledger(title: string, rows: LedgerRow[])}
	<section class="flex flex-col gap-3 p-4 sm:p-5">
		<h3 class="text-[0.6875rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
			{title}
		</h3>

		<div class="flex flex-col divide-y">
			{#each rows as row (row.label)}
				<div class="flex items-baseline justify-between gap-3 py-3 first:pt-0 last:pb-0">
					<span class="min-w-0 truncate text-sm text-muted-foreground">{row.label}</span>
					<span
						class={cn(
							'shrink-0 font-semibold tracking-tight tabular-nums',
							row.lead ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
						)}
					>
						{row.value}
					</span>
				</div>
			{/each}
		</div>
	</section>
{/snippet}

<Card class="gap-0 overflow-hidden p-0">
	<div class="grid divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0">
		{@render ledger('This month', thisMonth)}
		{@render ledger('Platform', platform)}
	</div>
</Card>
