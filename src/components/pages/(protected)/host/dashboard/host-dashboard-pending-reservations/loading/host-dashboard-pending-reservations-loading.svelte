<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	/**
	 * Loading state for the pending-requests strip.
	 *
	 * Keeps the band's primary tint and border while loading, so the card that arrives is
	 * the card that was already there — only its contents resolve.
	 *
	 * Two placeholder rows, not the display limit of five: most hosts have nought to a
	 * couple waiting, so two is the honest guess and it keeps the collapse small on the one
	 * case this band is designed around — nothing pending at all, where the strip is absent
	 * entirely (HostSystemDesign.md §2's Band-1 convention).
	 */
</script>

<Card class="gap-0 border-primary/30 bg-primary/3 p-4 sm:p-5" role="status" aria-busy="true">
	<span class="sr-only">{m['HostDashboardPage.HostDashboardPendingReservationsLoading.loadingPending']()}</span>

	<div class="mb-4 flex items-start gap-3">
		<Skeleton class="size-9 shrink-0 rounded-lg" />
		<div class="min-w-0 flex-1 space-y-2">
			<Skeleton class="h-5 w-44 max-w-full" />
			<Skeleton class="h-3 w-80 max-w-full" />
		</div>
	</div>

	<div class="flex flex-col divide-y">
		{#each [0, 1] as i (i)}
			<div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
				<Skeleton class="size-14 shrink-0 rounded-lg" />
				<div class="min-w-0 flex-1 space-y-1.5">
					<Skeleton class="h-4 w-40 max-w-full" />
					<Skeleton class="h-3 w-32 max-w-full" />
					<Skeleton class="h-3 w-56 max-w-full" />
				</div>
			</div>
		{/each}
	</div>

	<Skeleton class="mt-4 h-8 w-20 rounded-lg" />
</Card>
