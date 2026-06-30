<script module lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// TYPES
	import type { DateValue as CalendarDateValue } from '@internationalized/date';
	import type { DateRange } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { ComponentProps } from 'svelte';
	import type { RangeCalendar as RangeCalendarComponent } from '@/shared/components/ui/range-calendar/index.js';

	export type AvailabilityStatus = 'booked' | 'blocked';

	export type AvailabilityRange = {
		start: string | CalendarDateValue;
		end: string | CalendarDateValue;
		status?: AvailabilityStatus;
	};

	export type AvailabilityCalendarSelection = {
		value: DateRange;
		start: CalendarDateValue | undefined;
		end: CalendarDateValue | undefined;
		label: string;
		dayCount: number;
		hasSelection: boolean;
		clearSelection: () => void;
	};

	type BaseRangeCalendarProps = Omit<
		ComponentProps<typeof RangeCalendarComponent>,
		'value' | 'class' | 'day' | 'isDateDisabled' | 'isDateUnavailable' | 'onValueChange'
	>;

	export type AvailabilityCalendarProps = BaseRangeCalendarProps & {
		value?: DateRange;
		ranges?: AvailabilityRange[];
		disabledStatuses?: AvailabilityStatus[];
		/** Allow selecting the current day as check-in. When false, today is disabled and highlighted as unavailable. */
		allowToday?: boolean;
		/** Minimum number of nights a valid selection must span. */
		minNights?: number;
		/** Maximum number of nights a valid selection may span. */
		maxNights?: number;
		invalidSelectionMessage?: string;
		onInvalidSelection?: (message: string) => void;
		onValueChange?: (value: DateRange) => void;
		isDateDisabled?: (date: CalendarDateValue) => boolean;
		isDateUnavailable?: (date: CalendarDateValue) => boolean;
		selectionActions?: Snippet<[AvailabilityCalendarSelection]>;
		timeZone?: string;
		class?: string;
	};
</script>

<script lang="ts">
	// LIBRARIES
	import { getLocalTimeZone, parseDate, today, type DateValue } from '@internationalized/date';

	// COMPONENTS
	import {
		RangeCalendar,
		Day as RangeCalendarDay
	} from '@/shared/components/ui/range-calendar/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { formatDaysSelected, formatNights } from '@/utils/formatters';

	const defaultTimeZone = getLocalTimeZone();

	let {
		value = $bindable<DateRange>({ start: undefined, end: undefined }),
		ranges = [],
		disabledStatuses = ['booked'],
		allowToday = true,
		minNights,
		maxNights,
		invalidSelectionMessage = m['AvailabilityCalendar.invalidSelectionMessage'](),
		onInvalidSelection,
		onValueChange,
		isDateDisabled,
		isDateUnavailable,
		selectionActions,
		timeZone = defaultTimeZone,
		locale = 'en',
		numberOfMonths = 2,
		minValue,
		calendarLabel = m['AvailabilityCalendar.calendarLabel'](),
		class: className,
		...restProps
	}: AvailabilityCalendarProps = $props();

	type ParsedAvailabilityRange = {
		start: DateValue;
		end: DateValue;
		status: AvailabilityStatus;
	};

	const todayDate = $derived(today(timeZone));
	const calendarMinValue = $derived(minValue ?? todayDate);
	const disabledStatusSet = $derived(new Set(disabledStatuses));
	const formatter = $derived(
		new Intl.DateTimeFormat(locale, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		})
	);

	const parsedRanges = $derived.by<ParsedAvailabilityRange[]>(() =>
		ranges.map((range) => ({
			start: parseAvailabilityDate(range.start),
			end: parseAvailabilityDate(range.end),
			status: range.status ?? 'booked'
		}))
	);

	const selectionContext = $derived.by<AvailabilityCalendarSelection>(() => {
		const start = value.start;
		const end = value.end ?? value.start;
		const hasSelection = start !== undefined;

		return {
			value,
			start,
			end,
			label: start ? formatSelectionLabel(start, end) : '',
			dayCount: start && end ? countInclusiveDays(start, end) : 0,
			hasSelection,
			clearSelection
		};
	});

	function parseAvailabilityDate(date: string | DateValue): DateValue {
		return typeof date === 'string' ? parseDate(date) : date;
	}

	function createEmptyRange(): DateRange {
		return { start: undefined, end: undefined };
	}

	function isDateInRange(date: DateValue, range: ParsedAvailabilityRange): boolean {
		return date.compare(range.start) >= 0 && date.compare(range.end) < 0;
	}

	function getAvailabilityStatus(date: DateValue): AvailabilityStatus | undefined {
		if (isBeforeCalendarMinValue(date)) return undefined;

		const booked = parsedRanges.find(
			(range) => range.status === 'booked' && isDateInRange(date, range)
		);
		if (booked) return booked.status;

		return parsedRanges.find((range) => isDateInRange(date, range))?.status;
	}

	function isDateBlockedByStatus(date: DateValue): boolean {
		if (isBeforeCalendarMinValue(date)) return false;

		return parsedRanges.some(
			(range) => disabledStatusSet.has(range.status) && isDateInRange(date, range)
		);
	}

	function isTodayUnavailable(date: DateValue): boolean {
		return !allowToday && isToday(date);
	}

	function isCalendarDateDisabled(date: DateValue): boolean {
		return (
			isTodayUnavailable(date) || isDateBlockedByStatus(date) || (isDateDisabled?.(date) ?? false)
		);
	}

	function isCalendarDateUnavailable(date: DateValue): boolean {
		return isDateUnavailable?.(date) ?? false;
	}

	function isToday(date: DateValue): boolean {
		return date.compare(todayDate) === 0;
	}

	function isBeforeCalendarMinValue(date: DateValue): boolean {
		return date.compare(calendarMinValue) < 0;
	}

	function rangeHasDisabledDate(start: DateValue, end: DateValue): boolean {
		const [rangeStart, rangeEnd] = sortRange(start, end);
		let cursor = rangeStart;

		while (cursor.compare(rangeEnd) <= 0) {
			if (isCalendarDateDisabled(cursor)) return true;
			cursor = cursor.add({ days: 1 });
		}

		return false;
	}

	function sortRange(start: DateValue, end: DateValue): [DateValue, DateValue] {
		return start.compare(end) <= 0 ? [start, end] : [end, start];
	}

	function formatDate(date: DateValue): string {
		return formatter.format(date.toDate(timeZone));
	}

	function formatSelectionLabel(start: DateValue, end: DateValue | undefined): string {
		if (!end || start.compare(end) === 0) return formatDate(start);

		const [rangeStart, rangeEnd] = sortRange(start, end);
		return `${formatDate(rangeStart)} - ${formatDate(rangeEnd)}`;
	}

	function countInclusiveDays(start: DateValue, end: DateValue): number {
		const [rangeStart, rangeEnd] = sortRange(start, end);
		let count = 1;
		let cursor = rangeStart;

		while (cursor.compare(rangeEnd) < 0) {
			count += 1;
			cursor = cursor.add({ days: 1 });
		}

		return count;
	}

	function countNights(start: DateValue, end: DateValue): number {
		return countInclusiveDays(start, end) - 1;
	}

	/** Returns an error message when the committed range breaks a rule, otherwise undefined. */
	function validateRange(start: DateValue, end: DateValue): string | undefined {
		if (rangeHasDisabledDate(start, end)) return invalidSelectionMessage;

		const nights = countNights(start, end);
		if (minNights !== undefined && nights < minNights)
			return m['AvailabilityCalendar.minimumStay']({ nights: formatNights(minNights) });
		if (maxNights !== undefined && nights > maxNights)
			return m['AvailabilityCalendar.maximumStay']({ nights: formatNights(maxNights) });

		return undefined;
	}

	function clearSelection() {
		const emptyRange = createEmptyRange();
		value = emptyRange;
		onValueChange?.(emptyRange);
	}

	function handleValueChange(nextValue: DateRange) {
		if (nextValue.start && nextValue.end) {
			const error = validateRange(nextValue.start, nextValue.end);

			if (error) {
				const emptyRange = createEmptyRange();
				value = emptyRange;
				onInvalidSelection?.(error);
				onValueChange?.(emptyRange);
				return;
			}
		}

		onValueChange?.(nextValue);
	}
</script>

<div class="flex flex-col gap-5">
	<div class="flex">
		<RangeCalendar
			bind:value
			{numberOfMonths}
			minValue={calendarMinValue}
			{locale}
			{calendarLabel}
			disableDaysOutsideMonth={true}
			isDateDisabled={isCalendarDateDisabled}
			isDateUnavailable={isCalendarDateUnavailable}
			onValueChange={handleValueChange}
			class={cn('rounded-xl border', className)}
			{...restProps}
		>
			{#snippet day({ day: date, outsideMonth }: { day: DateValue; outsideMonth: boolean })}
				{#if !outsideMonth}
					{@const status = getAvailabilityStatus(date)}
					{@const booked = status === 'booked'}
					{@const blocked = status === 'blocked'}
					{@const todayCell = isToday(date)}
					{@const todaySelectable = todayCell && allowToday && !status}
					{@const todayUnavailable = todayCell && !allowToday && !status}
					<RangeCalendarDay
						data-availability-status={status}
						class={cn(
							'availability-calendar-day',
							todaySelectable && 'font-semibold ring-1 ring-primary/50',
							todayUnavailable && 'availability-calendar-day--today-unavailable',
							blocked && 'availability-calendar-day--blocked',
							booked && 'availability-calendar-day--booked',
							todayCell && status && 'font-semibold ring-2 ring-primary'
						)}
					/>
				{/if}
			{/snippet}
		</RangeCalendar>
	</div>

	{#if selectionActions && selectionContext.hasSelection}
		<div
			class="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
		>
			<div class="min-w-0">
				<p class="truncate text-sm font-medium">{selectionContext.label}</p>
				<p class="text-xs text-muted-foreground">
					{formatDaysSelected(selectionContext.dayCount)}
				</p>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				{@render selectionActions(selectionContext)}
			</div>
		</div>
	{/if}
</div>

<style>
	:global(
		.availability-calendar-day[data-availability-status]:not([data-selected]):not(
				[data-range-start]
			):not([data-range-end]):not([data-range-middle]):not([data-highlighted])
	) {
		text-decoration-line: line-through;
		text-decoration-thickness: 2px;
	}

	:global(
		.availability-calendar-day--blocked:not([data-selected]):not([data-range-start]):not(
				[data-range-end]
			):not([data-range-middle]):not([data-highlighted])
	) {
		background: var(--muted) !important;
		color: var(--muted-foreground) !important;
		text-decoration-color: color-mix(in oklab, var(--muted-foreground) 60%, transparent);
	}

	:global(
		.availability-calendar-day--booked:not([data-selected]):not([data-range-start]):not(
				[data-range-end]
			):not([data-range-middle]):not([data-highlighted])
	) {
		background: color-mix(in oklab, var(--destructive) 10%, transparent) !important;
		color: var(--destructive) !important;
		text-decoration-color: color-mix(in oklab, var(--destructive) 70%, transparent);
	}

	:global(.availability-calendar-day--booked[data-disabled]) {
		opacity: 1;
	}

	:global(
		.availability-calendar-day--today-unavailable:not([data-selected]):not([data-range-start]):not(
				[data-range-end]
			):not([data-range-middle]):not([data-highlighted])
	) {
		background: color-mix(in oklab, #eab308 22%, transparent) !important;
		color: #854d0e !important;
		font-weight: 600;
	}

	:global(.availability-calendar-day--today-unavailable[data-disabled]) {
		opacity: 1;
	}
</style>
