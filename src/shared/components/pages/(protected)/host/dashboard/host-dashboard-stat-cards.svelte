<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import { Card } from '@/shared/components/ui/card/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import {
		formatCurrency,
		formatDateShort,
		formatSignedCount,
		formatSignedCurrency
	} from '@/utils/formatters';

	// LUCIDE ICONS
	import PercentIcon from '@lucide/svelte/icons/percent';
	import BanknoteIcon from '@lucide/svelte/icons/banknote';
	import CalendarCheckIcon from '@lucide/svelte/icons/calendar-check';
	import HouseIcon from '@lucide/svelte/icons/house';

	// TYPES
	import type { Component } from 'svelte';
	import type { HostDashboardStats } from '@/convex/pages/host/dashboard/types/hostDashboardTypes';

	let { stats }: { stats: HostDashboardStats } = $props();

	const deltaPts = (n: number) => `${formatSignedCount(Math.round(n))} pts`;

	type Tile = { label: string; value: string; context: string; icon: Component; iconClass: string };

	const tiles = $derived<Tile[]>([
		{
			label: m['HostDashboardPage.Tiles.occupancy'](),
			value: `${Math.round(stats.tiles.occupancy.pct)}%`,
			context: m['HostDashboardPage.Tiles.vsLastMonth']({
				delta: deltaPts(stats.tiles.occupancy.deltaPts)
			}),
			icon: PercentIcon,
			iconClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
		},
		{
			label: m['HostDashboardPage.Tiles.revenue'](),
			value: formatCurrency(stats.tiles.revenue.amount),
			context: m['HostDashboardPage.Tiles.vsLastMonth']({
				delta: formatSignedCurrency(stats.tiles.revenue.deltaAmount)
			}),
			icon: BanknoteIcon,
			iconClass: 'bg-primary/10 text-primary'
		},
		{
			label: m['HostDashboardPage.Tiles.upcoming'](),
			value: String(stats.tiles.upcomingCheckIns.count),
			context: stats.tiles.upcomingCheckIns.nextDate
				? m['HostDashboardPage.Tiles.nextCheckIn']({
						date: formatDateShort(stats.tiles.upcomingCheckIns.nextDate)
					})
				: m['HostDashboardPage.Tiles.noUpcoming'](),
			icon: CalendarCheckIcon,
			iconClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
		},
		{
			label: m['HostDashboardPage.Tiles.accommodations'](),
			value: String(stats.accommodations.published),
			context:
				stats.accommodations.pendingReview > 0
					? m['HostDashboardPage.Tiles.pendingReview']({
							count: stats.accommodations.pendingReview
						})
					: stats.accommodations.published > 0
						? m['HostDashboardPage.Tiles.allLive']()
						: m['HostDashboardPage.Tiles.noAccommodationsYet'](),
			icon: HouseIcon,
			iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
		}
	]);
</script>

<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
	{#each tiles as tile (tile.label)}
		{@const Icon = tile.icon}

		<Card class="gap-0 p-4">
				<div class="flex items-center gap-3">
					<div
						class={cn(
							'flex size-9 shrink-0 items-center justify-center rounded-lg',
							tile.iconClass
						)}
					>
						<Icon class="size-5" aria-hidden="true" />
					</div>
					
					<p class="text-2xl font-semibold tracking-tight tabular-nums md:text-3xl">{tile.value}</p>
				</div>

				<div class="mt-3 space-y-0.5">
					<p class="text-sm font-medium">{tile.label}</p>
					<p class="truncate text-xs text-muted-foreground">{tile.context}</p>
				</div>
			</Card>
	{/each}
</div>
