<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	/**
	 * Skeleton mirroring the three bands (queue, pulse, ledger + chart) so nothing jumps
	 * when the data lands. The queue skeleton is small on purpose: an empty queue is the
	 * common, good outcome.
	 */
</script>

<div class="flex flex-col gap-6" role="status" aria-busy="true">
	<span class="sr-only">{m['AdminDashboardPage.AdminDashboardPageLoading.loadingDashboard']()}</span>

	<!-- Band 2: pulse row -->
	<div class="flex flex-col gap-2">
		<Skeleton class="h-3 w-16" />
		<Skeleton class="h-5 w-full max-w-xl" />
	</div>

	<!-- Band 3a: ledger -->
	<Card class="gap-0 overflow-hidden p-0">
		<div class="grid divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0">
			{#each ['left', 'right'] as side (side)}
				<div class="flex flex-col gap-3 p-4 sm:p-5">
					<Skeleton class="h-3 w-24" />
					<div class="flex flex-col divide-y">
						<div class="flex items-baseline justify-between py-3 pt-0">
							<Skeleton class="h-4 w-24" />
							<Skeleton class="h-8 w-20" />
						</div>
						<div class="flex items-baseline justify-between py-3 pb-0">
							<Skeleton class="h-4 w-28" />
							<Skeleton class="h-7 w-14" />
						</div>
					</div>
				</div>
			{/each}
		</div>
	</Card>

	<!-- Band 3b: chart -->
	<Card class="gap-3 p-4 sm:p-5">
		<div class="flex items-center justify-between">
			<Skeleton class="h-8 w-40" />
			<Skeleton class="h-6 w-28" />
		</div>
		<Skeleton class="h-72 w-full" />
	</Card>
</div>
