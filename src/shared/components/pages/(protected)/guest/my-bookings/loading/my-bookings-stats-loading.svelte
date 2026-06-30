<script lang="ts">
	// COMPONENTS
	import { Card } from '@/shared/components/ui/card/index.js';
	import { Skeleton } from '@/shared/components/ui/skeleton/index.js';
</script>

<!-- Mirrors my-bookings-stats: four stat cards in a responsive grid. -->
<div
	class="grid grid-cols-2 gap-3 lg:grid-cols-4"
	aria-busy="true"
	aria-label="Loading booking stats"
>
	{#each [0, 1, 2, 3] as card (card)}
		<Card class="gap-0 p-4">
			<div class="flex items-center gap-3">
				<Skeleton class="size-9 shrink-0 rounded-lg" />
				<Skeleton class="h-8 w-10 md:h-9" />
			</div>
			<div class="mt-3 space-y-1.5">
				<Skeleton class="h-4 w-24" />
				<Skeleton class="h-3 w-32 max-w-full" />
			</div>
		</Card>
	{/each}
</div>
