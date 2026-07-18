<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints';

	// COMPONENTS
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '@/shared/components/ui/table/index.js';
	import HostDashboardPerAccommodationTableEmpty from '@/shared/components/pages/(protected)/host/dashboard/empty/host-dashboard-per-accommodation-table-empty.svelte';

	// UTILS
	import { formatCurrency, formatDateShort } from '@/utils/formatters';

	// TYPES
	import type { HostAccommodationRow } from '@/convex/pages/host/dashboard/types/hostDashboardTypes';

	// LUCIDE ICONS
	import ImageIcon from '@lucide/svelte/icons/image';

	let { rows }: { rows: HostAccommodationRow[] } = $props();

	function editHref(id: string): string {
		return localizeHref(PROTECTED_PAGE_ENDPOINTS.EDIT_ACCOMMODATION.replace(':id', id));
	}
</script>

<section class="flex flex-col gap-3">
	<h2 class="text-base font-semibold tracking-tight">
		{m['HostDashboardPage.PerAccommodation.heading']()}
	</h2>

	{#if rows.length === 0}
		<HostDashboardPerAccommodationTableEmpty />
	{:else}
		<div class="overflow-x-auto rounded-xl border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{m['HostDashboardPage.PerAccommodation.colAccommodation']()}</TableHead>
						<TableHead class="text-right"
							>{m['HostDashboardPage.PerAccommodation.colOccupancy']()}</TableHead
						>
						<TableHead class="text-right"
							>{m['HostDashboardPage.PerAccommodation.colRevenue']()}</TableHead
						>
						<TableHead class="hidden text-right sm:table-cell">
							{m['HostDashboardPage.PerAccommodation.colNextCheckIn']()}
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each rows as row (row.apartmentId)}
						<TableRow class="cursor-pointer">
							<TableCell class="min-w-48">
								<a
									href={editHref(row.apartmentId)}
									class="flex min-w-0 items-center gap-3 hover:underline"
								>
									<div
										class="size-10 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border"
									>
										{#if row.imageUrl}
											<img
												src={row.imageUrl}
												alt=""
												class="size-full object-cover"
												loading="lazy"
											/>
										{:else}
											<div class="flex size-full items-center justify-center text-muted-foreground">
												<ImageIcon class="size-4" aria-hidden="true" />
											</div>
										{/if}
									</div>
									<span class="truncate text-sm font-medium">{row.title}</span>
								</a>
							</TableCell>
							<TableCell class="text-right tabular-nums">{Math.round(row.occupancyPct)}%</TableCell>
							<TableCell class="text-right tabular-nums">{formatCurrency(row.revenue)}</TableCell>
							<TableCell class="hidden text-right text-muted-foreground sm:table-cell">
								{row.nextCheckIn
									? formatDateShort(row.nextCheckIn)
									: m['HostDashboardPage.PerAccommodation.empty']()}
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	{/if}
</section>
