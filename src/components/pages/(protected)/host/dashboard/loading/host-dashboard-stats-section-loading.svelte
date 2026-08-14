<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	/**
	 * Loading state for the dashboard's stats section — earnings card, today strip, and the
	 * ledger, in that order.
	 *
	 * A skeleton's only job is to hold the shape the content will take, so this mirrors the
	 * real silhouettes deliberately: the earnings card's icon/copy/button row, the today
	 * strip's three cards, and the ledger's single divided surface with its meter. When the
	 * data lands, nothing jumps.
	 *
	 * It does NOT include the pending strip — that band loads on its own live query and owns
	 * its own skeleton — nor a chart, which moved to `/host/analytics`.
	 */
</script>

<div class="flex flex-col gap-6" role="status" aria-busy="true">
	<span class="sr-only">{m['HostDashboardPage.HostDashboardStatsSectionLoading.loading']()}</span>

	<!-- Earnings card: icon, two lines of copy, one action. -->
	<Card class="gap-0 p-4 sm:p-5">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex min-w-0 items-start gap-3">
				<Skeleton class="size-9 shrink-0 rounded-lg" />
				<div class="min-w-0 space-y-2">
					<Skeleton class="h-5 w-44 max-w-full" />
					<Skeleton class="h-3 w-72 max-w-full" />
				</div>
			</div>
			<Skeleton class="h-8 w-36 shrink-0 rounded-lg" />
		</div>
	</Card>

	<!-- Today strip: three cards, each a count line plus a couple of guest rows. -->
	<div class="grid gap-3 sm:grid-cols-3">
		{#each [0, 1, 2] as i (i)}
			<Card class="gap-3 p-4">
				<div class="flex items-center gap-2.5">
					<Skeleton class="size-8 shrink-0 rounded-lg" />
					<Skeleton class="h-7 w-7" />
					<Skeleton class="h-4 w-24" />
				</div>
				<div class="space-y-1.5">
					<Skeleton class="h-3 w-full" />
					<Skeleton class="h-3 w-4/5" />
				</div>
			</Card>
		{/each}
	</div>

	<!-- The ledger: one surface, two hairline-divided blocks, two rows each. The first
	     block's lead row carries the occupancy meter. -->
	<Card class="gap-0 overflow-hidden p-0">
		<div class="grid divide-y lg:grid-cols-[1.25fr_1fr] lg:divide-x lg:divide-y-0">
			{#each [0, 1] as block (block)}
				<div class="flex flex-col gap-3 p-4 sm:p-5">
					<Skeleton class="h-3 w-24" />

					<div class="flex flex-col divide-y">
						<div class="space-y-2 py-3 first:pt-0">
							<div class="flex items-baseline justify-between gap-3">
								<Skeleton class="h-4 w-24" />
								<Skeleton class="h-8 w-20" />
							</div>
							<div class="flex justify-end">
								<Skeleton class="h-3 w-32" />
							</div>
							{#if block === 0}
								<Skeleton class="h-1 w-full rounded-full" />
							{/if}
						</div>

						<div class="space-y-2 py-3 last:pb-0">
							<div class="flex items-baseline justify-between gap-3">
								<Skeleton class="h-4 w-20" />
								<Skeleton class="h-7 w-24" />
							</div>
							<div class="flex justify-end">
								<Skeleton class="h-3 w-28" />
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</Card>
</div>
