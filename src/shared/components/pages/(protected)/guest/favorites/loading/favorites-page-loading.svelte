<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/shared/components/ui/skeleton/index.js';
</script>

<!-- Card grid skeleton only — page header stays visible above. -->
<div class="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
	{#each [0, 1, 2, 3, 4, 5] as card (card)}
		<div class="flex flex-col gap-2.5">
			<Skeleton class="aspect-4/3 w-full rounded-2xl" />
			<div class="space-y-2">
				<Skeleton class="h-4 w-4/5" />
				<Skeleton class="h-3.5 w-1/2" />
				<Skeleton class="h-4 w-1/3" />
			</div>
		</div>
	{/each}
</div>
