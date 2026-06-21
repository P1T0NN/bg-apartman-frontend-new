<script lang="ts">
    // LIBRARIES
    import { m } from '@/shared/lib/paraglide/messages';
    import { getLocalTimeZone, today, type CalendarDate } from '@internationalized/date';

	// COMPONENTS
	import Calendar from '@/shared/components/ui/calendar/calendar.svelte';
	import * as Popover from '@/shared/components/ui/popover/index.js';
	import { Button } from '@/shared/components/ui/button/index.js';
	import { Label } from '@/shared/components/ui/label/index.js';

	// LUCIDE ICONS
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	const id = $props.id();

	let open = $state(false);
	let value = $state<CalendarDate | undefined>();
</script>

<div class="flex flex-col gap-3">
	<Label for="{id}-date" class="px-1">{m['DatePicker.dateOfBirth']()}</Label>

	<Popover.Root bind:open>
		<Popover.Trigger id="{id}-date">
			{#snippet child({ props })}
				<Button {...props} variant="outline" class="w-48 justify-between font-normal">
					{value ? value.toDate(getLocalTimeZone()).toLocaleDateString() : m['DatePicker.selectDate']()}
					<ChevronDownIcon />
				</Button>
			{/snippet}
		</Popover.Trigger>

		<Popover.Content class="w-auto overflow-hidden p-0" align="start">
			<Calendar
				type="single"
				bind:value
				captionLayout="dropdown"
				onValueChange={() => {
					open = false;
				}}
				maxValue={today(getLocalTimeZone())}
			/>
		</Popover.Content>
	</Popover.Root>
</div>
