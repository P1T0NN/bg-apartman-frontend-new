<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	// Bar heights are fixed (not random) so the skeleton is stable across re-renders.
	const bars = [40, 65, 50, 85, 60, 95, 70, 55, 80, 45, 75, 90];
</script>

<!-- Mirrors the revenue chart card: title/legend row, then a baseline-aligned bar silhouette. -->
<div class="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
	<div class="flex items-start justify-between gap-4">
		<div class="space-y-2">
			<Skeleton class="h-4 w-32" />
			<Skeleton class="h-3 w-48" />
		</div>
		<Skeleton class="h-8 w-24 rounded-md" />
	</div>

	<div class="mt-6 flex h-56 items-end gap-2 sm:gap-3">
		{#each bars as height, i (i)}
			<Skeleton class="w-full rounded-t-md rounded-b-none" style="height: {height}%" />
		{/each}
	</div>
</div>

<!-- Mirrors the per-accommodation table: header row + data rows. -->
<div class="rounded-xl border border-border/60 bg-card shadow-sm">
	<div class="border-b border-border/60 p-5">
		<Skeleton class="h-4 w-40" />
	</div>

	<div class="divide-y divide-border/60">
		{#each [0, 1, 2, 3] as i (i)}
			<div class="flex items-center gap-4 px-5 py-4">
				<Skeleton class="size-10 shrink-0 rounded-lg" />
				<Skeleton class="h-4 w-full max-w-56" />
				<div class="ml-auto flex shrink-0 gap-6">
					<Skeleton class="h-4 w-12" />
					<Skeleton class="h-4 w-16" />
				</div>
			</div>
		{/each}
	</div>
</div>
