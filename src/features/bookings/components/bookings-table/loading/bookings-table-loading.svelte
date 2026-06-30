<script lang="ts">
	// COMPONENTS
	import { Card } from '@/shared/components/ui/card/index.js';
	import { Skeleton } from '@/shared/components/ui/skeleton/index.js';

	const filterWidths = ['w-14', 'w-24', 'w-24', 'w-28', 'w-28', 'w-24'] as const;
</script>

<!-- Mirrors bookings-table: filter pills, search, table rows, pagination. -->
<div class="flex flex-col gap-4" aria-busy="true" aria-label="Loading bookings">
	<div class="flex flex-wrap items-center gap-1.5">
		{#each filterWidths as width, index (index)}
			<Skeleton class="h-8 {width} rounded-full" />
		{/each}
	</div>

	<Skeleton class="h-10 w-full max-w-sm rounded-md" />

	<Card class="hidden overflow-hidden md:block">
		<div class="flex gap-4 border-b px-4 py-3">
			{#each [0, 1, 2, 3, 4, 5] as cell (cell)}
				<Skeleton class="h-4 flex-1" />
			{/each}
		</div>
		{#each [0, 1, 2, 3, 4, 5] as row (row)}
			<div class="flex gap-4 border-b px-4 py-3 last:border-b-0">
				{#each [0, 1, 2, 3, 4, 5] as cell (cell)}
					<Skeleton class="h-4 flex-1" />
				{/each}
			</div>
		{/each}
	</Card>

	<div class="flex flex-col gap-3 md:hidden">
		{#each [0, 1, 2, 3] as row (row)}
			<Card class="gap-3 px-4 py-4">
				{#each [0, 1, 2, 3] as line (line)}
					<div class="space-y-1.5">
						<Skeleton class="h-3 w-20" />
						<Skeleton class="h-4 w-full max-w-56" />
					</div>
				{/each}
			</Card>
		{/each}
	</div>

	<div class="flex items-center justify-center gap-2">
		<Skeleton class="size-9 rounded-md" />
		<Skeleton class="h-9 w-9 rounded-md" />
		<Skeleton class="h-9 w-9 rounded-md" />
		<Skeleton class="size-9 rounded-md" />
	</div>
</div>
