<script lang="ts">
	// COMPONENTS
	import DashboardUpcomingItem from '@/shared/components/pages/(protected)/guest/dashboard/dashboard-upcoming/dashboard-upcoming-item.svelte';

	// TYPES
	import type { GuestTripSummary } from '@/convex/pages/guest/dashboard/types/guestDashboardTypes';

	let { trips }: { trips: GuestTripSummary[] } = $props();
</script>

{#if trips.length}
	<div class="space-y-3">
		<h3 class="text-sm font-medium text-muted-foreground">More upcoming</h3>
		
		<div class="grid gap-3">
			{#each trips as trip (trip.id)}
				<DashboardUpcomingItem {trip} />
			{/each}
		</div>
	</div>
{/if}
