<script lang="ts" module>
	/** The page-wide analytics window, resolved to epoch ms. `null` = custom not yet complete. */
	export type AnalyticsWindow = { from: number; to: number } | null;
</script>

<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// LIBRARIES
	import { getLocalTimeZone, parseDate, today } from '@internationalized/date';
	import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs-svelte';
	import { toast } from 'svelte-sonner';

	// CONFIG
	import { MS_PER_DAY } from '@/shared/config';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { NativePopover } from '@/components/ui/native-popover/index.js';
	import RangeCalendar from '@/components/ui/range-calendar/range-calendar.svelte';
	import { formatDateRange } from '@/components/ui/custom-charts/timerange-data.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { CalendarDate } from '@internationalized/date';
	import type { DateRange } from 'bits-ui';

	// LUCIDE ICONS
	import CalendarIcon from '@lucide/svelte/icons/calendar';

	const PRESETS = [
		{ value: '7d', label: '7d', days: 7 },
		{ value: '30d', label: '30d', days: 30 },
		{ value: '90d', label: '90d', days: 90 }
	] as const;

	const PERIOD_VALUES = ['7d', '30d', '90d', 'custom'] as const;

	// The custom-range rules, enforced at BOTH entry points (calendar pick and URL parse):
	// under a week is too few day-buckets to read as a trend, over a year the server (and
	// the analytics component) refuses.
	const MIN_CUSTOM_DAYS = 7;
	const MAX_CUSTOM_DAYS = 365;

	const todayDate = today(getLocalTimeZone());

	/**
	 * The page's ONE period control (top-right of `/host/analytics`): 7d / 30d / 90d /
	 * Custom as a segmented button group, Custom opening a range calendar. The choice is
	 * URL-backed (`?period=`, `?from=`, `?to=`) so a filtered view survives refresh and can
	 * be sent to someone.
	 *
	 * The component owns HOW a period is chosen; it hands the page only the resolved
	 * `[from, to]` window via `bind:window` — the page fetches, every surface renders.
	 */
	// Named to avoid shadowing the browser's `window` global.
	let { analyticsWindow = $bindable(null) }: { analyticsWindow?: AnalyticsWindow } = $props();

	// Every key replaces history (arrowing through periods is one history entry) and the
	// default '30d' stays out of the URL.
	const url = useQueryStates({
		period: parseAsStringLiteral(PERIOD_VALUES)
			.withDefault('30d')
			.withOptions({ history: 'replace', shallow: true, scroll: false, clearOnDefault: true }),
		from: parseAsString.withOptions({ history: 'replace', shallow: true, scroll: false }),
		to: parseAsString.withOptions({ history: 'replace', shallow: true, scroll: false })
	});

	const period = $derived(url.period.current);

	let calendarOpen = $state(false);

	/**
	 * THE validity rule for a custom range — one predicate for both entry points, so the
	 * calendar and a hand-edited URL can never disagree about what's acceptable: within the
	 * span limits, in the right order, nothing in the future. Exactly what the calendar's
	 * own constraints (`minValue`/`maxValue` + the pick effect) allow through.
	 */
	function validateCustomRange(
		fromStr: string | null,
		toStr: string | null
	): { start: CalendarDate; end: CalendarDate } | null {
		if (!fromStr || !toStr) return null;
		try {
			const start = parseDate(fromStr);
			const end = parseDate(toStr);
			const span = end.compare(start) + 1; // inclusive days; negative when reversed
			if (span < MIN_CUSTOM_DAYS || span > MAX_CUSTOM_DAYS) return null;
			if (end.compare(todayDate) > 0) return null;
			return { start, end };
		} catch {
			return null; // unparseable dates
		}
	}

	// Calendar state seeds from the URL once (deep link) — through the same validation, so
	// a mangled URL never paints a range the calendar itself couldn't have produced.
	let customRange = $state<DateRange | undefined>(
		validateCustomRange(url.from.current, url.to.current) ?? undefined
	);

	function pickPreset(value: (typeof PRESETS)[number]['value']) {
		url.set({ period: value, from: null, to: null });
	}

	function pickCustom() {
		url.set({ period: 'custom' });
		calendarOpen = true;
	}

	/**
	 * A completed calendar pick lands in the URL; incomplete picks change nothing. Too-short
	 * ranges are rejected with a toast — the interactive face of the same
	 * `validateCustomRange` rule (the calendar's `minValue`/`maxValue` already rule out the
	 * other violations, so span is the only thing left to check here).
	 *
	 * An EVENT HANDLER, deliberately not an `$effect`: nuqs's `url` members are reactive, so
	 * an effect that calls `url.set` is also subscribed to the very state it writes — write,
	 * re-run, write again, `effect_update_depth_exceeded`. Events run untracked.
	 */
	function handleRangeChange(range: DateRange) {
		if (!range.start || !range.end) return;

		// `compare` on calendar dates returns the difference in days; +1 = inclusive span.
		if (range.end.compare(range.start) + 1 < MIN_CUSTOM_DAYS) {
			toast.error(m['HostAnalyticsPage.HostAnalyticsPeriodPicker.minDaysError']({ days: MIN_CUSTOM_DAYS }));
			customRange = undefined; // popover stays open for a re-pick
			return;
		}

		void url.set({ from: range.start.toString(), to: range.end.toString() });
		calendarOpen = false;
	}

	// Resolve the window and hand it up. Presets end "now" so today's bookings count;
	// custom ranges span whole days in UTC — matching the server's UTC day buckets.
	$effect(() => {
		if (period !== 'custom') {
			const days = PRESETS.find((p) => p.value === period)?.days ?? 30;
			const to = Date.now();
			analyticsWindow = { from: to - days * MS_PER_DAY, to };
			return;
		}

		const { from, to } = { from: url.from.current, to: url.to.current };
		if (!from && !to) {
			analyticsWindow = null; // Custom just clicked — range not picked yet
			return;
		}

		const valid = validateCustomRange(from, to);
		if (!valid) {
			// A range the calendar could not have produced (hand-edited, truncated, reversed,
			// future, out of span bounds) is noise, not intent: silently normalize back to the
			// default preset and clean the URL so it reflects what's actually shown.
			url.set({ period: null, from: null, to: null });
			return;
		}

		analyticsWindow = {
			from: Date.UTC(valid.start.year, valid.start.month - 1, valid.start.day),
			to: Date.UTC(valid.end.year, valid.end.month - 1, valid.end.day) + MS_PER_DAY - 1
		};
	});

	const customLabel = $derived(
		customRange?.start && customRange?.end ? formatDateRange(customRange) : m['HostAnalyticsPage.HostAnalyticsPeriodPicker.custom']()
	);
</script>

<div class="flex flex-wrap items-center gap-2">
	<div class="inline-flex rounded-lg border bg-muted/40 p-0.5">
		{#each PRESETS as preset (preset.value)}
			<button
				type="button"
				aria-pressed={period === preset.value}
				onclick={() => pickPreset(preset.value)}
				class={cn(
					'rounded-md px-3 py-1.5 text-sm font-medium transition',
					period === preset.value
						? 'bg-background text-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'
				)}
			>
				{preset.label}
			</button>
		{/each}

		<button
			type="button"
			aria-pressed={period === 'custom'}
			onclick={pickCustom}
			class={cn(
				'rounded-md px-3 py-1.5 text-sm font-medium transition',
				period === 'custom'
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'
			)}
		>
			{m['HostAnalyticsPage.HostAnalyticsPeriodPicker.custom']()}
		</button>
	</div>

	{#if period === 'custom'}
		<NativePopover bind:open={calendarOpen} align="end" contentClass="w-auto overflow-hidden p-0">
			{#snippet trigger({ props, anchorStyle })}
				<Button
					{...props}
					style={anchorStyle}
					variant="outline"
					class="justify-start rounded-lg font-normal"
					aria-label={m['HostAnalyticsPage.HostAnalyticsPeriodPicker.selectCustomRange']()}
				>
					<CalendarIcon />
					<span>{customLabel}</span>
				</Button>
			{/snippet}
			{#snippet content()}
				<RangeCalendar
					bind:value={customRange}
					onValueChange={handleRangeChange}
					minValue={todayDate.subtract({ days: 365 })}
					maxValue={todayDate}
					numberOfMonths={2}
					fixedWeeks
					hideOutsideDays
					class="w-full"
				/>
			{/snippet}
		</NativePopover>
	{/if}
</div>
