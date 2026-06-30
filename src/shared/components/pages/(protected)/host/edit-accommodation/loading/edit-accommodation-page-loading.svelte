<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/shared/components/ui/skeleton/index.js';
</script>

<!-- Mirrors the real edit page: header + "View listing" action, the 3-tab list,
     and the Information form's section cards. Pure skeletons, no copy. -->
<div class="flex flex-col gap-6">
	<!-- Header: title + subtitle, and the View listing button -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
		<div class="flex flex-col gap-2">
			<Skeleton class="h-8 w-56" />
			<Skeleton class="h-4 w-72" />
		</div>
		<Skeleton class="h-8 w-32 shrink-0 rounded-lg" />
	</div>

	<!-- Tabs list: Information / Calendar / Settings -->
	<div class="flex w-fit gap-1 rounded-lg bg-muted p-1">
		<Skeleton class="h-8 w-28" />
		<Skeleton class="h-8 w-24" />
		<Skeleton class="h-8 w-24" />
	</div>

	<!-- Information content: section cards, each a header + a 2-col field grid -->
	<div class="flex flex-col gap-6 pt-2">
		{#each [0, 1, 2] as card (card)}
			<div class="flex flex-col gap-5 rounded-xl border p-5 sm:p-6">
				<div class="flex items-start gap-3.5">
					<Skeleton class="size-11 shrink-0 rounded-xl" />
					<div class="flex flex-1 flex-col gap-2">
						<Skeleton class="h-5 w-40" />
						<Skeleton class="h-4 w-64" />
					</div>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					{#each [0, 1, 2, 3] as field (field)}
						<div class="flex flex-col gap-1.5">
							<Skeleton class="h-3 w-24" />
							<Skeleton class="h-9 w-full rounded-md" />
						</div>
					{/each}
				</div>
			</div>
		{/each}

		<!-- Save changes button -->
		<Skeleton class="h-10 w-full rounded-lg" />
	</div>
</div>
