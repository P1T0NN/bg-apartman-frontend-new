<script lang="ts">
	// COMPONENTS
	import * as Card from '@/shared/components/ui/card/index.js';
	import { Skeleton } from '@/shared/components/ui/skeleton/index.js';
</script>

<!-- Mirrors the guest dashboard: header, shortcut tiles, next-trip hero, more-upcoming list. -->
<div class="flex flex-col gap-8">
	<header class="space-y-2">
		<Skeleton class="h-8 w-56" />
		<Skeleton class="h-4 w-72 max-w-full" />
	</header>

	<div class="grid gap-4 sm:grid-cols-3">
		{#each [0, 1, 2] as tile (tile)}
			<Card.Root class="flex-row items-center justify-between p-4">
				<div class="space-y-2">
					<Skeleton class="h-8 w-10" />
					<Skeleton class="h-4 w-24" />
				</div>
				<Skeleton class="size-5 rounded-md" />
			</Card.Root>
		{/each}
	</div>

	<Card.Root class="overflow-hidden p-0">
		<div class="grid md:grid-cols-[minmax(0,1fr)_1.3fr]">
			<Skeleton class="aspect-4/3 rounded-none md:aspect-auto md:h-full md:min-h-64" />

			<div class="flex flex-col gap-5 p-5 md:p-6">
				<div class="flex flex-wrap gap-2">
					<Skeleton class="h-6 w-20 rounded-full" />
					<Skeleton class="h-6 w-24 rounded-full" />
				</div>

				<div class="space-y-2">
					<Skeleton class="h-3 w-24" />
					<Skeleton class="h-7 w-4/5" />
					<Skeleton class="h-4 w-32" />
				</div>

				<dl class="grid grid-cols-2 gap-x-4 gap-y-3">
					{#each [0, 1, 2, 3] as item (item)}
						<div class="space-y-1.5">
							<Skeleton class="h-3 w-16" />
							<Skeleton class="h-4 w-28" />
						</div>
					{/each}
				</dl>

				<div class="mt-auto flex flex-wrap gap-3 pt-1">
					<Skeleton class="h-10 w-36 rounded-lg" />
					<Skeleton class="h-10 w-32 rounded-lg" />
				</div>
			</div>
		</div>
	</Card.Root>

	<div class="space-y-3">
		<Skeleton class="h-4 w-28" />
		<div class="grid gap-3">
			{#each [0, 1] as row (row)}
				<Card.Root class="flex-row items-center gap-4 p-3">
					<Skeleton class="size-16 shrink-0 rounded-lg" />
					<div class="min-w-0 flex-1 space-y-2">
						<Skeleton class="h-4 w-3/5" />
						<Skeleton class="h-3.5 w-4/5" />
					</div>
					<Skeleton class="hidden h-6 w-20 rounded-full sm:block" />
					<Skeleton class="size-4 shrink-0 rounded-sm" />
				</Card.Root>
			{/each}
		</div>
	</div>
</div>
