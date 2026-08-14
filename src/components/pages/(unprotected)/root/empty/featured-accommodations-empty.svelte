<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// LUCIDE ICONS
	import HouseIcon from '@lucide/svelte/icons/house';
</script>

<div
	class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center"
>
	<div class="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
		<HouseIcon class="size-7" aria-hidden="true" />
	</div>

	<div class="flex flex-col gap-1.5">
		<h3 class="text-lg font-semibold">{m['HomePage.FeaturedAccommodationsEmpty.emptyTitle']()}</h3>
		<p class="mx-auto max-w-sm text-sm text-muted-foreground">
			{m['HomePage.FeaturedAccommodationsEmpty.emptyText']()}
		</p>
	</div>
</div>
