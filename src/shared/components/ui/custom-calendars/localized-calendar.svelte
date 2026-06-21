<script lang="ts">
    // LIBRARIES
    import { CalendarDate } from '@internationalized/date';
    import { getLocale } from '@/shared/lib/paraglide/runtime';
    import { m } from '@/shared/lib/paraglide/messages';

    // COMPONENTS
	import * as Card from '@/shared/components/ui/card/index.js';
	import * as Select from '@/shared/components/ui/select/index.js';
	import RangeCalendar from '@/shared/components/ui/range-calendar/range-calendar.svelte';

	// TYPES
	import type { DateRange } from 'bits-ui';

	let value = $state<DateRange | undefined>({
		start: new CalendarDate(2025, 9, 9),
		end: new CalendarDate(2025, 9, 17)
	});

	const currentLocale = getLocale();
	let locale = $state(currentLocale);

	const languageOptions = [
		{
			label: 'English',
			value: 'en'
		},
		{
			label: 'Español',
			value: 'es'
		}
	];

	const selectedLanguage = $derived(
		languageOptions.find((option) => option.value === locale)?.label ?? 'Language'
	);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{m['LocalizedCalendar.title']()}</Card.Title>
        
		<Card.Description>{m['LocalizedCalendar.description']()}</Card.Description>

		<Card.Action>
			<Select.Root type="single" bind:value={locale}>
				<Select.Trigger class="w-[100px]" aria-label="Select language">
					{selectedLanguage}
				</Select.Trigger>

				<Select.Content align="end">
					{#each languageOptions as option (option.value)}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</Card.Action>
	</Card.Header>

	<Card.Content>
		<RangeCalendar
			bind:value
			numberOfMonths={2}
			{locale}
			class="bg-transparent p-0"
			buttonVariant="outline"
		/>
	</Card.Content>
</Card.Root>
