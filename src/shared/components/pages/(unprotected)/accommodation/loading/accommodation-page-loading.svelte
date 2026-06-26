<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/shared/components/ui/skeleton/index.js';
</script>

<!-- Mirrors the real detail page: gallery, then a two-column grid with the content
     stack on the left and the sticky booking card on the right. Pure skeletons, no copy. -->
<div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
	<div class="py-5 md:py-6">
		<div class="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:grid-rows-2">
			<Skeleton class="aspect-4/3 w-full rounded-xl sm:col-span-2 sm:row-span-2 sm:aspect-auto" />
			<Skeleton class="hidden aspect-4/3 w-full rounded-xl sm:block" />
			<Skeleton class="hidden aspect-4/3 w-full rounded-xl sm:block" />
			<Skeleton class="hidden aspect-4/3 w-full rounded-xl sm:block" />
			<Skeleton class="hidden aspect-4/3 w-full rounded-xl sm:block" />
		</div>
	</div>

	<div class="grid grid-cols-1 gap-x-12 gap-y-8 pb-16 lg:grid-cols-[minmax(0,1fr)_24rem]">
		<div class="min-w-0 space-y-6">
			<div class="space-y-3">
				<Skeleton class="h-8 w-3/4" />
				<Skeleton class="h-4 w-1/2" />
				<div class="flex flex-wrap gap-3 pt-1">
					{#each [0, 1, 2, 3] as fact (fact)}
						<Skeleton class="h-4 w-24" />
					{/each}
				</div>
			</div>

			{#each [0, 1, 2] as block (block)}
				<div class="space-y-3 border-t pt-6">
					<Skeleton class="h-5 w-40" />
					<Skeleton class="h-4 w-full" />
					<Skeleton class="h-4 w-5/6" />
				</div>
			{/each}
		</div>

		<aside class="hidden lg:block">
			<div class="sticky top-20 space-y-4 rounded-xl border p-6">
				<Skeleton class="h-7 w-32" />
				<Skeleton class="h-11 w-full rounded-lg" />
				<Skeleton class="mx-auto h-3 w-40" />
			</div>
		</aside>
	</div>
</div>
