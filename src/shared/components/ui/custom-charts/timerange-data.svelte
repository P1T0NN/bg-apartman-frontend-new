<script lang="ts" module>
    // LIBRARIES
	import { CalendarDate, getLocalTimeZone, type DateValue } from '@internationalized/date';

	// TYPES
	import type { DateRange } from 'bits-ui';

	export type TimeRangeValue = `${number}d` | 'custom';

	export interface TimeRangeOption {
		value: TimeRangeValue;
		label: string;
		days?: number;
	}

	export interface TimeRangeBoundsOptions {
		value: TimeRangeValue;
		customRange?: DateRange;
		referenceDate: Date;
		options?: TimeRangeOption[];
		timeZone?: string;
	}

	export interface FilterTimeRangeDataOptions<TData> extends TimeRangeBoundsOptions {
		data: TData[];
		dateAccessor: keyof TData | ((item: TData) => Date);
	}

	export const DEFAULT_TIME_RANGE_OPTIONS: TimeRangeOption[] = [
		{ value: '90d', label: 'Last 3 months', days: 90 },
		{ value: '30d', label: 'Last 30 days', days: 30 },
		{ value: '7d', label: 'Last 7 days', days: 7 }
	];

	export function toCalendarDate(date: Date) {
		return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
	}

	export function toDate(date: DateValue, timeZone = getLocalTimeZone()) {
		return date.toDate(timeZone);
	}

	export function endOfDay(date: Date) {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
	}

	export function formatDateValue(
		date: DateValue,
		locale = 'en-US',
		options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
		timeZone = getLocalTimeZone()
	) {
		return toDate(date, timeZone).toLocaleDateString(locale, options);
	}

	export function formatDateRange(
		range: DateRange | undefined,
		locale = 'en-US',
		options?: Intl.DateTimeFormatOptions,
		timeZone = getLocalTimeZone()
	) {
		if (!range?.start || !range?.end) return 'Select dates';
		return `${formatDateValue(range.start, locale, options, timeZone)} - ${formatDateValue(
			range.end,
			locale,
			options,
			timeZone
		)}`;
	}

	export function getPresetDays(value: TimeRangeValue, options = DEFAULT_TIME_RANGE_OPTIONS) {
		const preset = options.find((option) => option.value === value);
		if (preset?.days !== undefined) return preset.days;
		const match = /^(\d+)d$/.exec(value);
		return match ? Number(match[1]) : undefined;
	}

	export function getTimeRangeBounds({
		value,
		customRange,
		referenceDate,
		options = DEFAULT_TIME_RANGE_OPTIONS,
		timeZone = getLocalTimeZone()
	}: TimeRangeBoundsOptions) {
		if (value === 'custom') {
			if (!customRange?.start || !customRange?.end) return undefined;
			return {
				start: toDate(customRange.start, timeZone),
				end: endOfDay(toDate(customRange.end, timeZone))
			};
		}

		const days = getPresetDays(value, options);
		if (days === undefined) return undefined;

		const start = new Date(
			referenceDate.getFullYear(),
			referenceDate.getMonth(),
			referenceDate.getDate() - days,
			referenceDate.getHours(),
			referenceDate.getMinutes(),
			referenceDate.getSeconds(),
			referenceDate.getMilliseconds()
		);

		return {
			start,
			end: endOfDay(referenceDate)
		};
	}

	export function filterTimeRangeData<TData>({
		data,
		dateAccessor,
		...rangeOptions
	}: FilterTimeRangeDataOptions<TData>) {
		const bounds = getTimeRangeBounds(rangeOptions);
		if (!bounds) return data;

		return data.filter((item) => {
			const date = typeof dateAccessor === 'function' ? dateAccessor(item) : item[dateAccessor];
			if (!(date instanceof Date)) return false;
			return date >= bounds.start && date <= bounds.end;
		});
	}

	export function formatTimeRangeLabel(
		value: TimeRangeValue,
		customRange?: DateRange,
		options = DEFAULT_TIME_RANGE_OPTIONS,
		locale = 'en-US',
		timeZone = getLocalTimeZone()
	) {
		if (value === 'custom') return formatDateRange(customRange, locale, undefined, timeZone);
		return options.find((option) => option.value === value)?.label ?? 'Select range';
	}
</script>

<script lang="ts">
    // COMPONENTS
	import * as Select from '@/shared/components/ui/select/index.js';
	import * as Popover from '@/shared/components/ui/popover/index.js';
	import { Button } from '@/shared/components/ui/button/index.js';
	import RangeCalendar from '@/shared/components/ui/range-calendar/range-calendar.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// LUCIDE ICONS
	import CalendarIcon from '@lucide/svelte/icons/calendar';

	let {
		value = $bindable<TimeRangeValue>('90d'),
		customRange = $bindable<DateRange | undefined>(),
		placeholder = $bindable<DateValue | undefined>(),
		options = DEFAULT_TIME_RANGE_OPTIONS,
		customLabel = 'Custom',
		selectAriaLabel = 'Select time range',
		calendarAriaLabel = 'Select custom date range',
		locale = 'en-US',
		timeZone = getLocalTimeZone(),
		minValue,
		maxValue,
		numberOfMonths = 2,
		captionLayout = 'label',
		fixedWeeks = true,
		class: className,
		selectTriggerClass = 'w-40 rounded-lg sm:ms-auto',
		selectContentClass = 'rounded-xl',
		calendarButtonClass,
		popoverContentClass = 'w-auto overflow-hidden p-0',
		calendarClass = 'w-full'
	}: {
		value?: TimeRangeValue;
		customRange?: DateRange;
		placeholder?: DateValue;
		options?: TimeRangeOption[];
		customLabel?: string;
		selectAriaLabel?: string;
		calendarAriaLabel?: string;
		locale?: string;
		timeZone?: string;
		minValue?: DateValue;
		maxValue?: DateValue;
		numberOfMonths?: number;
		captionLayout?: 'dropdown' | 'dropdown-months' | 'dropdown-years' | 'label';
		fixedWeeks?: boolean;
		class?: string;
		selectTriggerClass?: string;
		selectContentClass?: string;
		calendarButtonClass?: string;
		popoverContentClass?: string;
		calendarClass?: string;
	} = $props();

	let calendarOpen = $state(false);

	const isCustom = $derived(value === 'custom');
	const selectedLabel = $derived(formatTimeRangeLabel(value, customRange, options, locale, timeZone));
	const customRangeLabel = $derived(formatDateRange(customRange, locale, undefined, timeZone));

	function handleValueChange(nextValue: string) {
		if (nextValue === 'custom') {
			calendarOpen = true;
		}
	}
</script>

<div class={cn('flex flex-wrap items-center justify-end gap-2', className)}>
	<Select.Root type="single" bind:value onValueChange={handleValueChange}>
		<Select.Trigger class={selectTriggerClass} aria-label={selectAriaLabel}>
			{selectedLabel}
		</Select.Trigger>
		<Select.Content align="end" class={selectContentClass}>
			{#each options as option (option.value)}
				<Select.Item value={option.value} class="rounded-lg">{option.label}</Select.Item>
			{/each}
			<Select.Item value="custom" class="rounded-lg">{customLabel}</Select.Item>
		</Select.Content>
	</Select.Root>

	{#if isCustom}
		<Popover.Root bind:open={calendarOpen}>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="outline"
						class={cn('min-w-44 justify-start rounded-lg font-normal', calendarButtonClass)}
						aria-label={calendarAriaLabel}
					>
						<CalendarIcon />
						<span>{customRangeLabel}</span>
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content align="end" class={popoverContentClass}>
				<RangeCalendar
					bind:value={customRange}
					bind:placeholder
					{locale}
					{minValue}
					{maxValue}
					{numberOfMonths}
					{captionLayout}
					{fixedWeeks}
					class={calendarClass}
				/>
			</Popover.Content>
		</Popover.Root>
	{/if}
</div>
