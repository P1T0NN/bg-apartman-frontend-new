<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// UTILS
	import { cn } from '@/utils/utils.js';

	let {
		variant = 'host',
		allowToday = true,
		class: className
	}: {
		/** Host view includes blocked dates; guest view is the public booking picker. */
		variant?: 'host' | 'guest';
		/** When false on the guest picker, today is shown as unavailable instead of selectable. */
		allowToday?: boolean;
		class?: string;
	} = $props();
</script>

<div
	class={cn(
		'flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground',
		className
	)}
>
	<span class="flex items-center gap-2">
		<span class="size-5 rounded-md bg-primary" aria-hidden="true"></span>
		{m['AvailabilityCalendar.AvailabilityCalendarLegend.selected']()}
	</span>

	{#if variant === 'host' || allowToday}
		<span class="flex items-center gap-2">
			<span class="size-5 rounded-md bg-accent ring-1 ring-primary/40" aria-hidden="true"></span>
			{m['AvailabilityCalendar.AvailabilityCalendarLegend.today']()}
		</span>
	{:else}
		<span class="flex items-center gap-2">
			<span
				class="size-5 rounded-md bg-[color-mix(in_oklab,#eab308_22%,transparent)] ring-1 ring-[#eab308]/30"
				aria-hidden="true"
			></span>
			{m['AvailabilityCalendar.AvailabilityCalendarLegend.todayUnavailable']()}
		</span>
	{/if}

	{#if variant === 'host'}
		<span class="flex items-center gap-2">
			<span
				class="flex size-5 items-center justify-center rounded-md bg-muted text-[10px] font-medium text-muted-foreground line-through"
				aria-hidden="true"
			>
				7
			</span>
			{m['AvailabilityCalendar.AvailabilityCalendarLegend.blocked']()}
		</span>
	{/if}

	<span class="flex items-center gap-2">
		<span
			class="flex size-5 items-center justify-center rounded-md bg-destructive/10 text-[10px] font-medium text-destructive line-through"
			aria-hidden="true"
		>
			7
		</span>
		{m['AvailabilityCalendar.AvailabilityCalendarLegend.booked']()}
	</span>
</div>
