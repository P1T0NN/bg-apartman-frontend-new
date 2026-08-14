<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints.js';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';
	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';

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
		`${appHref(PROTECTED_PAGE_ENDPOINTS.GUEST_MY_BOOKINGS)}?status=${status}`;

	const tiles = $derived<Tile[]>([
		{
			label: m['GuestDashboardPage.DashboardShortcuts.upcomingTrips'](),
			value: upcomingCount,
			icon: CalendarCheckIcon,
			href: myBookingsHref('confirmed')
		},
		{
			label: m['GuestDashboardPage.DashboardShortcuts.savedPlaces'](),
			value: savedCount,
			icon: HeartIcon,
			href: appHref(PROTECTED_PAGE_ENDPOINTS.GUEST_FAVORITES)
		},
		{
			label: m['GuestDashboardPage.DashboardShortcuts.checkedOut'](),
			value: checkedOutCount > 99 ? '99+' : checkedOutCount,
			icon: CircleCheckIcon,
			href: myBookingsHref('checked_out')
		}
	]);
</script>

<div class="grid gap-4 sm:grid-cols-3">
	{#each tiles as tile (tile.label)}
		<a
			href={tile.href}
			class="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
		>
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
