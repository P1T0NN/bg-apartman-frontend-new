<script lang="ts">
	// COMPONENTS
	import { Card } from '@/shared/components/ui/card/index.js';
	import { Skeleton } from '@/shared/components/ui/skeleton/index.js';
</script>

<div class="flex flex-col gap-6">
	<Card class="gap-4 border-primary/30 bg-primary/[0.03] p-4 sm:p-5">
		<Skeleton class="h-5 w-48" />
		{#each [0, 1] as i (i)}
			<div class="flex items-center gap-3">
				<Skeleton class="size-14 rounded-lg" />
				<div class="flex-1 space-y-2">
					<Skeleton class="h-4 w-40" />
					<Skeleton class="h-3 w-56" />
				</div>
				<Skeleton class="h-9 w-24" />
			</div>
		{/each}
	</Card>

	<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
		{#each [0, 1, 2, 3] as i (i)}
			<Card class="gap-0 p-4">
				<div class="flex items-center gap-3">
					<Skeleton class="size-9 rounded-lg" />
					<Skeleton class="h-8 w-16" />
				</div>
				<Skeleton class="mt-3 h-4 w-24" />
				<Skeleton class="mt-1.5 h-3 w-28" />
			</Card>
		{/each}
	</div>

	<div class="grid gap-3 sm:grid-cols-3">
		{#each [0, 1, 2] as i (i)}
			<Card class="gap-3 p-4">
				<Skeleton class="h-4 w-28" />
				<Skeleton class="h-3 w-40" />
				<Skeleton class="h-3 w-32" />
			</Card>
		{/each}
	</div>

	<Skeleton class="h-80 w-full rounded-xl" />
</div>
