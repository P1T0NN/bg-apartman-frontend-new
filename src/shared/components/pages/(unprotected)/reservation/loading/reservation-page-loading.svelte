<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import { Separator } from '@/shared/components/ui/separator/index.js';
	import { Skeleton } from '@/shared/components/ui/skeleton/index.js';
</script>

<!-- Mirrors ReservationConfirmation: success icon, title, summary card, email note, actions. -->
<div
	class="mx-auto max-w-lg py-10 text-center sm:py-16"
	aria-busy="true"
	aria-label={m['ReservationPage.ReservationPageLoading.ariaLabel']()}
>
	<Skeleton class="mx-auto size-14 rounded-full" />

	<div class="mx-auto mt-5 space-y-2">
		<Skeleton class="mx-auto h-8 w-56" />
		<Skeleton class="mx-auto h-4 w-full max-w-sm" />
	</div>

	<div class="mt-6 space-y-4 rounded-2xl border p-5 text-left sm:p-6">
		<div class="flex items-center justify-between gap-3">
			<Skeleton class="h-4 w-32" />
			<Skeleton class="h-4 w-24" />
		</div>

		<Separator />

		<dl class="space-y-2">
			{#each [0, 1, 2, 3, 4] as row (row)}
				<div class="flex items-center justify-between gap-3">
					<Skeleton class="h-4 w-20" />
					<Skeleton class="h-4 w-28" />
				</div>
			{/each}
		</dl>
	</div>

	<Skeleton class="mx-auto mt-5 h-4 w-48" />

	<div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
		<Skeleton class="mx-auto h-10 w-full rounded-lg sm:w-36" />
		<Skeleton class="mx-auto h-10 w-full rounded-lg sm:w-40" />
	</div>
</div>
