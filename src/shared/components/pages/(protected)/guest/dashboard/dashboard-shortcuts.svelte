<script lang="ts">
	// LIBRARIES
	import { localizeHref } from '@/shared/lib/paraglide/runtime.js';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints.js';

	// COMPONENTS
	import * as Card from '@/shared/components/ui/card/index.js';

	// TYPES
	import type { Component } from 'svelte';

	// LUCIDE ICONS
	import CalendarCheckIcon from '@lucide/svelte/icons/calendar-check';
	import HeartIcon from '@lucide/svelte/icons/heart';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check-big';

	let {
		upcomingCount = 0,
		checkedOutCount = 0,
		savedCount = 0
	}: {
		upcomingCount?: number;
		checkedOutCount?: number;
		savedCount?: number;
	} = $props();

	type Tile = {
		label: string;
		value: number | string;
		icon: Component;
		href: string;
	};

	const myBookingsHref = (status: string) =>
		`${localizeHref(PROTECTED_PAGE_ENDPOINTS.GUEST_MY_BOOKINGS)}?status=${status}`;

	const tiles = $derived<Tile[]>([
		{
			label: 'Upcoming trips',
			value: upcomingCount,
			icon: CalendarCheckIcon,
			href: myBookingsHref('confirmed')
		},
		{
			label: 'Saved places',
			value: savedCount,
			icon: HeartIcon,
			href: localizeHref(PROTECTED_PAGE_ENDPOINTS.GUEST_FAVORITES)
		},
		{
			label: 'Checked out',
			value: checkedOutCount > 99 ? '99+' : checkedOutCount,
			icon: CircleCheckIcon,
			href: myBookingsHref('checked_out')
		}
	]);
</script>

<div class="grid gap-4 sm:grid-cols-3">
	{#each tiles as tile (tile.label)}
		<a href={tile.href} class="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
			<Card.Root class="flex-row items-center justify-between p-4 transition hover:bg-muted/40">
				<div>
					<p class="text-2xl font-semibold tracking-tight">{tile.value}</p>
					<p class="text-sm text-muted-foreground">{tile.label}</p>
				</div>
				<tile.icon class="size-5 text-muted-foreground" aria-hidden="true" />
			</Card.Root>
		</a>
	{/each}
</div>
