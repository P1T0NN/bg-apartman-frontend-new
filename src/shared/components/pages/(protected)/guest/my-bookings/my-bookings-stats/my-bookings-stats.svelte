<script lang="ts">
	// COMPONENTS
	import MyBookingsStatsItem from './my-bookings-stats-item.svelte';
	import MyBookingsStatsLoading from '../loading/my-bookings-stats-loading.svelte';

	// UTILS
	import { formatCurrency } from '@/utils/formatters';

	// TYPES
	import type { Component } from 'svelte';
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	// LUCIDE ICONS
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import CalendarCheckIcon from '@lucide/svelte/icons/calendar-check';
	import HouseIcon from '@lucide/svelte/icons/house';
	import BanknoteIcon from '@lucide/svelte/icons/banknote';

	let {
		bookings,
		isLoading = false
	}: {
		bookings: typesBookingSafe[];
		isLoading?: boolean;
	} = $props();

	type Stat = {
		label: string;
		value: string;
		hint: string;
		icon: Component;
		iconClass: string;
		emphasized?: boolean;
	};

	const pendingCount = $derived(bookings.filter((b) => b.status === 'pending').length);
	const upcomingCount = $derived(bookings.filter((b) => b.status === 'confirmed').length);
	const hostingCount = $derived(bookings.filter((b) => b.status === 'checked_in').length);
	const paidRevenue = $derived(
		bookings.reduce((sum, b) => (b.paymentStatus === 'paid' ? sum + b.total : sum), 0)
	);

	const stats = $derived<Stat[]>([
		{
			label: 'Requests to review',
			value: String(pendingCount),
			hint: pendingCount > 0 ? 'Awaiting your response' : 'You’re all caught up',
			icon: InboxIcon,
			iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
			emphasized: pendingCount > 0
		},
		{
			label: 'Upcoming stays',
			value: String(upcomingCount),
			hint: 'Confirmed & on the way',
			icon: CalendarCheckIcon,
			iconClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
		},
		{
			label: 'Hosting now',
			value: String(hostingCount),
			hint: 'Guests currently checked in',
			icon: HouseIcon,
			iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
		},
		{
			label: 'Paid revenue',
			value: formatCurrency(paidRevenue),
			hint: 'Collected across all stays',
			icon: BanknoteIcon,
			iconClass: 'bg-primary/10 text-primary'
		}
	]);
</script>

{#if isLoading}
	<MyBookingsStatsLoading />
{:else}
	<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
		{#each stats as stat (stat.label)}
			<MyBookingsStatsItem {...stat} />
		{/each}
	</div>
{/if}
