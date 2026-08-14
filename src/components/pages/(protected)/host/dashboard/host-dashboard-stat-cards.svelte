<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import {
		formatCurrency,
		formatDateShort,
		formatSignedCount,
		formatSignedCurrency
	} from '@/utils/formatters';

	// LUCIDE ICONS
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';

	// TYPES
	import type { HostDashboardStats } from '@/convex/pages/host/dashboard/types/hostDashboardTypes';

	/**
	 * The host's headline numbers, set as a LEDGER rather than a stat-card grid.
	 *
	 * Why not cards: four identical icon+number cards is the pattern DESIGN.md bans by name
	 * ("no big-number stat strip"), and it wore the same costume as the today strip directly
	 * below it — two adjacent bands reading as one texture. It also flattened four different
	 * KINDS of fact into one shape.
	 *
	 * What it is instead: one surface, hairline-divided, with labels left and figures
	 * right-aligned in a number column — the way a statement or a front-desk ledger reads
	 * (DESIGN.md's north star, and its "Hairline First" rule). The split is semantic, not
	 * cosmetic: the left block holds the two figures that COMPARE to last month, the right
	 * block holds the two that describe what's ahead. Grouping them says something the old
	 * uniform grid could not.
	 *
	 * Icons are gone on purpose. A percent glyph beside a percentage is decoration; the
	 * today strip keeps its icons because there they distinguish arrival from departure from
	 * in-house, which is real work.
	 *
	 * The occupancy meter is the one moment of colour. Amber is sanctioned here — DESIGN.md
	 * lists "chart series one" alongside buttons and selection in the Brass Hardware rule —
	 * and occupancy is the only figure with a natural 0–100 scale, so it earns the visual.
	 */
	let { stats }: { stats: HostDashboardStats } = $props();

	type Trend = { dir: 'up' | 'down' | 'flat'; text: string };

	type LedgerRow = {
		label: string;
		value: string;
		/** Month-over-month movement. Absent on rows that have nothing to compare against. */
		trend?: Trend;
		/** Quiet right-aligned line under the figure. */
		note?: string;
		/** 0–100 — renders the occupancy meter. */
		meter?: number;
		/** The lead row of its block: one size up, so the eye has somewhere to land. */
		lead?: boolean;
	};

	/**
	 * Direction is carried by the arrow AND the sign as well as the colour, never by colour
	 * alone (PRODUCT.md's a11y contract) — the row still reads correctly in greyscale.
	 */
	function trendOf(delta: number, text: string): Trend {
		if (delta === 0) return { dir: 'flat', text: m['HostDashboardPage.HostDashboardStatCards.noChange']() };
		return { dir: delta > 0 ? 'up' : 'down', text };
	}

	const thisMonth = $derived<LedgerRow[]>([
		{
			label: m['HostDashboardPage.HostDashboardStatCards.occupancy'](),
			value: `${Math.round(stats.tiles.occupancy.pct)}%`,
			trend: trendOf(
				stats.tiles.occupancy.deltaPts,
				m['HostDashboardPage.HostDashboardStatCards.pts']({ count: formatSignedCount(Math.round(stats.tiles.occupancy.deltaPts)) })
			),
			meter: Math.min(100, Math.max(0, stats.tiles.occupancy.pct)),
			lead: true
		},
		{
			label: m['HostDashboardPage.HostDashboardStatCards.revenue'](),
			value: formatCurrency(stats.tiles.revenue.amount),
			trend: trendOf(
				stats.tiles.revenue.deltaAmount,
				formatSignedCurrency(stats.tiles.revenue.deltaAmount)
			)
		}
	]);

	const ahead = $derived<LedgerRow[]>([
		{
			label: m['HostDashboardPage.HostDashboardStatCards.checkIns'](),
			value: String(stats.tiles.upcomingCheckIns.count),
			note: stats.tiles.upcomingCheckIns.nextDate
				? m['HostDashboardPage.HostDashboardStatCards.nextDate']({ date: formatDateShort(stats.tiles.upcomingCheckIns.nextDate) })
				: m['HostDashboardPage.HostDashboardStatCards.noneInNext7Days'](),
			lead: true
		},
		{
			label: m['HostDashboardPage.HostDashboardStatCards.published'](),
			value: String(stats.accommodations.published),
			note:
				stats.accommodations.pendingReview > 0
					? m['HostDashboardPage.HostDashboardStatCards.inReview']({ count: stats.accommodations.pendingReview })
					: stats.accommodations.published > 0
						? m['HostDashboardPage.HostDashboardStatCards.allLive']()
						: m['HostDashboardPage.HostDashboardStatCards.nothingLiveYet']()
		}
	]);

	const trendClass: Record<Trend['dir'], string> = {
		up: 'text-emerald-600 dark:text-emerald-400',
		down: 'text-destructive',
		flat: 'text-muted-foreground'
	};
</script>

{#snippet ledger(title: string, rows: LedgerRow[])}
	<section class="flex flex-col gap-3 p-4 sm:p-5">
		<h3 class="text-[0.6875rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
			{title}
		</h3>

		<div class="flex flex-col divide-y">
			{#each rows as row (row.label)}
				<div class="py-3 first:pt-0 last:pb-0">
					<!-- Label left, figure right: the number column is what makes this scannable. -->
					<div class="flex items-baseline justify-between gap-3">
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

					{#if row.trend || row.note}
						<p class="mt-1 flex items-center justify-end gap-1 text-xs">
							{#if row.trend}
								{#if row.trend.dir === 'up'}
									<ArrowUpIcon
										class="size-3 shrink-0 text-emerald-600 dark:text-emerald-400"
										aria-hidden="true"
									/>
								{:else if row.trend.dir === 'down'}
									<ArrowDownIcon class="size-3 shrink-0 text-destructive" aria-hidden="true" />
								{/if}
								<span class={cn('tabular-nums', trendClass[row.trend.dir])}>
									{row.trend.text}
								</span>
								<span class="text-muted-foreground">{m['HostDashboardPage.HostDashboardStatCards.vsLastMonth']()}</span>
							{:else if row.note}
								<span class="truncate text-muted-foreground">{row.note}</span>
							{/if}
						</p>
					{/if}

					{#if row.meter !== undefined}
						<!-- Decorative: the percentage is already stated above, so this is not a
						     second announcement for assistive tech. -->
						<div class="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
							<div
								class="h-full rounded-full bg-primary transition-[width] duration-500 ease-out motion-reduce:transition-none"
								style={`width: ${row.meter}%`}
							></div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</section>
{/snippet}

<!--
	One surface, not four. The 1.25fr/1fr split gives the comparable figures the wider
	column without making the layout look broken at any breakpoint.
-->
<Card class="gap-0 overflow-hidden p-0">
	<div class="grid divide-y lg:grid-cols-[1.25fr_1fr] lg:divide-x lg:divide-y-0">
		{@render ledger(m['HostDashboardPage.HostDashboardStatCards.thisMonth'](), thisMonth)}
		{@render ledger(m['HostDashboardPage.HostDashboardStatCards.ahead'](), ahead)}
	</div>
</Card>
