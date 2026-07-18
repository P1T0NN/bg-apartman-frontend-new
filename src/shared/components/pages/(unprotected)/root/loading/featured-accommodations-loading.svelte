<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/shared/components/ui/skeleton/index.js';
</script>

<!-- Mirrors the boxed AccommodationCard: image block + title/meta/price lines. -->
<div class="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
	{#each [0, 1, 2, 3] as i (i)}
		<div class="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
			<Skeleton class="aspect-4/3 w-full rounded-none" />
			<div class="space-y-2 p-3.5">
				<Skeleton class="h-4 w-3/4" />
				<Skeleton class="h-3 w-1/2" />
				<Skeleton class="h-4 w-1/3" />
			</div>
		</div>
	{/each}
</div>
