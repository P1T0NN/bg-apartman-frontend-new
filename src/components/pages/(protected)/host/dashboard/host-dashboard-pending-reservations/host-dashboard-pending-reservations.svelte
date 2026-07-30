<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import HostDashboardPendingReservationsItem from './host-dashboard-pending-reservations-item.svelte';
	import HostDashboardPendingReservationsLoading from './loading/host-dashboard-pending-reservations-loading.svelte';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';

	// TYPES
	import type { HostPendingReservations } from '@/convex/pages/host/dashboard/types/hostDashboardTypes';

	// LUCIDE ICONS
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

	/**
	 * Subscription, justified (GeneralSystemDesignRule.md): requests arrive from guests and
	 * the lifecycle cron expires them while the host watches — the rule's admin-orders case
	 * verbatim. The ONLY live channel on this page; the stats and chart legs are one-shot,
	 * so a new request re-runs this small bounded read and nothing else.
	 *
	 * Fetched here rather than passed in, so the page file stays a layout of bands.
	 */
	const pendingQuery = useQuery(
		api.pages.host.dashboard.queries.fetchHostDashboardPendingBookings
			.fetchHostDashboardPendingBookings,
		() => ({})
	);

	const data = $derived(pendingQuery.data as HostPendingReservations | undefined);

	// Pending reservations are read-only here — confirming/declining happens on the reservations
	// page. This card just surfaces what's waiting and links across.
	const pendingHref = `${PROTECTED_PAGE_ENDPOINTS.RESERVATIONS}?status=pending`;
</script>

<!--
	Branch order: error → loading → content. Absent when nothing is waiting — the band-1
	convention, where absence means "done" rather than an empty card claiming space
	(HostSystemDesign.md §2). That is also why the skeleton can collapse to nothing: an
	empty queue is the good outcome, not a missing one.
-->
{#if pendingQuery.error}
	<ErrorComponent
		variant="content"
		title="Couldn't load pending requests"
		description="Open your reservations to answer them."
	>
		<Button href={pendingHref} variant="ghost" size="sm">Reservations</Button>
	</ErrorComponent>
{:else if data === undefined}
	<HostDashboardPendingReservationsLoading />
{:else if data.items.length > 0}
	<Card class="gap-0 border-primary/30 bg-primary/3 p-4 sm:p-5">
		<div class="mb-4 flex items-start gap-3">
			<span
				class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
			>
				<InboxIcon class="size-5" aria-hidden="true" />
			</span>
			<div class="min-w-0 flex-1">
				<h2 class="text-base font-semibold tracking-tight">Pending reservations</h2>
				<p class="text-xs text-muted-foreground">
					Requests waiting for your response — they expire automatically.
				</p>
			</div>
		</div>

		<ul class="flex flex-col divide-y">
			{#each data.items as booking (booking._id)}
				<HostDashboardPendingReservationsItem {booking} />
			{/each}
		</ul>

		<Button href={pendingHref} variant="outline" size="sm" class="mt-4 self-start">
			View
			<ArrowRightIcon class="size-4" aria-hidden="true" />
		</Button>
	</Card>
{/if}
