<script lang="ts">
	// COMPONENTS
	import { Card } from '@/shared/components/ui/card/index.js';

	// UTILS
	import { cn } from '@/shared/utils/utils.js';
	import { formatCurrency } from '@/features/bookings/utils/bookingsPresentation';

	// LUCIDE ICONS
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import CalendarCheckIcon from '@lucide/svelte/icons/calendar-check';
	import HouseIcon from '@lucide/svelte/icons/house';
	import BanknoteIcon from '@lucide/svelte/icons/banknote';

	// TYPES
	import type { Component } from 'svelte';
	import type { BookingRecord } from '@/features/bookings/data/bookingsDummyData';

	let { bookings }: { bookings: BookingRecord[] } = $props();

	const pendingCount = $derived(bookings.filter((b) => b.status === 'pending').length);
	const upcomingCount = $derived(bookings.filter((b) => b.status === 'confirmed').length);
	const hostingCount = $derived(bookings.filter((b) => b.status === 'checked_in').length);
	const paidRevenue = $derived(
		bookings.reduce((sum, b) => (b.paymentStatus === 'paid' ? sum + b.total : sum), 0)
	);

	type Stat = {
		label: string;
		value: string;
		hint: string;
		icon: Component;
		iconClass: string;
		/** Pull focus to this card when there is something to act on. */
		emphasized?: boolean;
	};

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

<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
	{#each stats as stat (stat.label)}
		{@const Icon = stat.icon}
		<Card
			class={cn(
				'gap-0 p-4 transition-colors',
				stat.emphasized && 'ring-1 ring-amber-500/30 dark:ring-amber-400/20'
			)}
		>
			<div class="flex items-center gap-3">
				<div class={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', stat.iconClass)}>
					<Icon class="size-5" aria-hidden="true" />
				</div>
				<p class="text-2xl font-semibold tracking-tight tabular-nums md:text-3xl">{stat.value}</p>
			</div>
			<div class="mt-3 space-y-0.5">
				<p class="text-sm font-medium">{stat.label}</p>
				<p class="truncate text-xs text-muted-foreground">{stat.hint}</p>
			</div>
		</Card>
	{/each}
</div>
