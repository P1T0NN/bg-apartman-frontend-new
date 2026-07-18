<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// LUCIDE ICONS
	import PartyPopperIcon from '@lucide/svelte/icons/party-popper';
</script>

<div
	class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-12 text-center"
>
	<div class="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
		<PartyPopperIcon class="size-7" aria-hidden="true" />
	</div>

	<div class="flex flex-col gap-1.5">
		<h2 class="text-base font-semibold tracking-tight">
			{m['HostDashboardPage.HostDashboardNoBookingsEmpty.title']()}
		</h2>
		
		<p class="mx-auto max-w-sm text-sm text-muted-foreground">
			{m['HostDashboardPage.HostDashboardNoBookingsEmpty.description']()}
		</p>
	</div>
</div>
