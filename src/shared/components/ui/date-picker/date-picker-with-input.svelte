<script lang="ts">
    // SVELTEKIT IMPORTS
    import { untrack } from 'svelte';

    // LIBRARIES
    import { m } from '@/shared/lib/paraglide/messages';
    import { parseDate } from 'chrono-node';
	import { CalendarDate, getLocalTimeZone, type DateValue } from '@internationalized/date';
    
    // COMPONENTS
	import { Label } from '@/shared/components/ui/label/index.js';
	import * as Popover from '@/shared/components/ui/popover/index.js';
	import { Button } from '@/shared/components/ui/button/index.js';
	import { Calendar } from '@/shared/components/ui/calendar/index.js';
	import { Input } from '@/shared/components/ui/input/index.js';

	// LUCIDE ICONS
	import CalendarIcon from '@lucide/svelte/icons/calendar';

	function formatDate(date: DateValue | undefined) {
		if (!date) return '';

		return date.toDate(getLocalTimeZone()).toLocaleDateString('en-US', {
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		});
	}

	const id = $props.id();

	let open = $state(false);
	let inputValue = $state('In 2 days');
	let value = $state<DateValue | undefined>(
		untrack(() => {
			const date = parseDate(inputValue);
			if (date) return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
			return undefined;
		})
	);
</script>

<div class="flex flex-col gap-3">
	<Label for="{id}-date" class="px-1">{m['DatePicker.scheduleDate']()}</Label>

	<div class="relative flex gap-2">
		<Input
			id="date"
			bind:value={
				() => inputValue,
				(v) => {
					inputValue = v;
					const date = parseDate(v);
					if (date) {
						value = new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
					}
				}
			}
			placeholder={m['DatePicker.scheduleDatePlaceholder']()}
			class="bg-background pe-10"
			onkeydown={(e) => {
				if (e.key === 'ArrowDown') {
					e.preventDefault();
					open = true;
				}
			}}
		/>

		<Popover.Root bind:open>
			<Popover.Trigger id="{id}-date-picker">
				{#snippet child({ props })}
					<Button {...props} variant="ghost" class="absolute end-2 top-1/2 size-6 -translate-y-1/2">
						<CalendarIcon class="size-3.5" />
						<span class="sr-only">{m['DatePicker.selectDate']()}</span>
					</Button>
				{/snippet}
			</Popover.Trigger>

			<Popover.Content class="w-auto overflow-hidden p-0" align="end">
				<Calendar
					type="single"
					bind:value
					captionLayout="dropdown"
					onValueChange={(v) => {
						inputValue = formatDate(v);
						open = false;
					}}
				/>
			</Popover.Content>
		</Popover.Root>
	</div>

	<div class="px-1 text-sm text-muted-foreground">
		Your post will be published on
		<span class="font-medium">{formatDate(value)}</span>.
	</div>
</div>
