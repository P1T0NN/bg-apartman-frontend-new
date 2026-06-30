<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';
	import { BOOKING_FILTERS, BOOKING_STATUS_CONFIG } from '@/features/bookings/data/bookingsData';

	// TYPES
	import type { typesBookingFilter } from '@/shared/features/booking/types/bookingTypes';

	let {
		activeFilter,
		counts,
		onFilterChange
	}: {
		activeFilter: typesBookingFilter;
		counts: Record<typesBookingFilter, number>;
		onFilterChange: (filter: typesBookingFilter) => void;
	} = $props();

	function filterChipClass(filter: typesBookingFilter): string {
		if (filter === 'all') return 'bg-background text-muted-foreground';
		return BOOKING_STATUS_CONFIG[filter].badgeClass;
	}
</script>

<div class="flex flex-wrap items-center gap-1.5">
	{#each BOOKING_FILTERS as filter (filter.value)}
		{@const isActive = activeFilter === filter.value}
		<button
			type="button"
			onclick={() => onFilterChange(filter.value)}
			aria-pressed={isActive}
			class={cn(
				'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
				isActive
					? 'border-primary bg-primary text-primary-foreground'
					: 'border-transparent bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
			)}
		>
			{filter.label}
			<span
				class={cn(
					'rounded-full px-1.5 text-xs tabular-nums',
					isActive ? 'bg-primary-foreground/20' : filterChipClass(filter.value)
				)}
			>
				{counts[filter.value]}
			</span>
		</button>
	{/each}
</div>
