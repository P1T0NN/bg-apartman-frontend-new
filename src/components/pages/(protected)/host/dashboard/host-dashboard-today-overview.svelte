<script lang="ts">
	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// LUCIDE ICONS
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import HouseIcon from '@lucide/svelte/icons/house';

	// TYPES
	import type { Component } from 'svelte';
	import type {
		HostToday,
		HostTodaySlice
	} from '@/convex/pages/host/dashboard/types/hostDashboardTypes';

	let { data }: { data: HostToday | undefined } = $props();

	type Group = { title: string; slice: HostTodaySlice; icon: Component; iconClass: string };

	const groups = $derived<Group[]>(
		data
			? [
					{
						title: 'Check-ins today',
						slice: data.checkIns,
						icon: LogInIcon,
						iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
					},
					{
						title: 'Check-outs today',
						slice: data.checkOuts,
						icon: LogOutIcon,
						iconClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
					},
					{
						title: 'Currently hosting',
						slice: data.hosting,
						icon: HouseIcon,
						iconClass: 'bg-primary/10 text-primary'
					}
				]
			: []
	);

	const allQuiet = $derived(
		data !== undefined &&
			data.checkIns.total === 0 &&
			data.checkOuts.total === 0 &&
			data.hosting.total === 0
	);
</script>

{#if data}
	{#if allQuiet}
		<p class="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
			No arrivals or departures today.
		</p>
	{:else}
		<div class="grid gap-3 sm:grid-cols-3">
			{#each groups as group (group.title)}
				{@const Icon = group.icon}

				<Card class="gap-3 p-4">
					<div class="flex items-center gap-2.5">
						<span
							class={cn(
								'flex size-8 shrink-0 items-center justify-center rounded-lg',
								group.iconClass
							)}
						>
							<Icon class="size-4" aria-hidden="true" />
						</span>

						<p class="text-2xl font-semibold tabular-nums">{group.slice.total}</p>
						<p class="text-sm font-medium text-muted-foreground">{group.title}</p>
					</div>

					{#if group.slice.total === 0}
						<p class="text-xs text-muted-foreground">Nothing today</p>
					{:else}
						<ul class="space-y-0.5">
							{#each group.slice.items as row (row.bookingId)}
								<li class="truncate text-xs text-muted-foreground">
									<span class="font-medium text-foreground">{row.guestName}</span> · {row.accommodationTitle}
								</li>
							{/each}

							{#if group.slice.total > group.slice.items.length}
								<li class="text-xs text-muted-foreground">
									+{group.slice.total - group.slice.items.length} more
								</li>
							{/if}
						</ul>
					{/if}
				</Card>
			{/each}
		</div>
	{/if}
{/if}
