<script lang="ts">
	// LIBRARIES
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { today, getLocalTimeZone, parseDate, type DateValue } from '@internationalized/date';

	// CONFIG
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// COMPONENTS
	import * as Popover from '@/shared/components/ui/popover/index.js';
	import { RangeCalendar } from '@/shared/components/ui/range-calendar/index.js';
	import { Button } from '@/shared/components/ui/button/index.js';
	import { Separator } from '@/shared/components/ui/separator/index.js';

	// UTILS
	import { cn } from '@/shared/utils/utils.js';
	import {
		hasNightlyDiscount,
		priceQuote,
		formatCurrency,
		formatGuestsShort
	} from '@/features/accommodations/utils/accommodationPresentation';

	// LUCIDE ICONS
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ZapIcon from '@lucide/svelte/icons/zap';
	import BanknoteIcon from '@lucide/svelte/icons/banknote';

	// TYPES
	import type { DateRange } from 'bits-ui';
	import type { AccommodationDetail } from '@/features/accommodations/data/accommodationDummyData';

	let {
		accommodation,
		dateRange = $bindable<DateRange>({ start: undefined, end: undefined }),
		adults = $bindable(2),
		children = $bindable(0)
	}: {
		accommodation: AccommodationDetail;
		dateRange?: DateRange;
		adults?: number;
		children?: number;
	} = $props();

	const tz = getLocalTimeZone();
	const minDate = today(tz);

	let datesOpen = $state(false);
	let guestsOpen = $state(false);

	// Pre-parse the booked ranges so the calendar can grey out taken nights.
	const bookedRanges = $derived(
		accommodation.bookedRanges.map((r) => ({
			start: parseDate(r.start),
			end: parseDate(r.end)
		}))
	);

	function isDateUnavailable(date: DateValue): boolean {
		return bookedRanges.some((r) => date.compare(r.start) >= 0 && date.compare(r.end) < 0);
	}

	const nights = $derived.by(() => {
		const s = dateRange?.start;
		const e = dateRange?.end;
		if (!s || !e) return 0;
		return Math.max(0, Math.round((e.toDate(tz).getTime() - s.toDate(tz).getTime()) / 86400000));
	});

	const quote = $derived(priceQuote(accommodation, nights));
	const totalGuests = $derived(adults + children);

	function fmt(d?: DateValue): string {
		return d ? d.toDate(tz).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '';
	}

	function onRangeChange(v: DateRange) {
		if (v?.start && v?.end) datesOpen = false;
	}

	function reserve() {
		const s = dateRange?.start;
		const e = dateRange?.end;
		if (!s || !e || nights === 0) {
			toast.info('Select your check-in and check-out dates to continue');
			datesOpen = true;
			return;
		}
		// Hand the chosen trip off to the dedicated booking page via the URL, so the
		// selection survives refreshes and the back button returns here intact.
		const query = new URLSearchParams({
			checkIn: s.toString(),
			checkOut: e.toString(),
			adults: String(adults),
			children: String(children)
		});
		goto(`${localizeHref(`/accommodation/${accommodation.slug}/book`)}?${query.toString()}`);
	}
</script>

<div class="space-y-4">
	<!-- Price -->
	<div class="flex items-baseline gap-2">
		<span class="text-2xl font-semibold">{formatCurrency(quote.nightly)}</span>
		<span class="text-muted-foreground">night</span>
		{#if hasNightlyDiscount(accommodation)}
			<span class="text-sm text-muted-foreground line-through">
				{formatCurrency(accommodation.pricePerNight)}
			</span>
		{/if}
	</div>

	<!-- Dates + guests selector -->
	<div class="divide-y overflow-hidden rounded-xl border">
		<Popover.Root bind:open={datesOpen}>
			<Popover.Trigger>
				{#snippet child({ props })}
					<button
						{...props}
						type="button"
						class="grid w-full grid-cols-2 divide-x text-left transition-colors hover:bg-muted/40"
					>
						<span class="flex flex-col px-3.5 py-2.5">
							<span class="text-[0.7rem] font-semibold tracking-wide uppercase text-muted-foreground">
								Check-in
							</span>
							<span class="text-sm">{dateRange?.start ? fmt(dateRange.start) : 'Add date'}</span>
						</span>
						<span class="flex flex-col px-3.5 py-2.5">
							<span class="text-[0.7rem] font-semibold tracking-wide uppercase text-muted-foreground">
								Checkout
							</span>
							<span class="text-sm">{dateRange?.end ? fmt(dateRange.end) : 'Add date'}</span>
						</span>
					</button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-auto overflow-hidden p-0" align="center">
				<RangeCalendar
					bind:value={dateRange}
					minValue={minDate}
					minDays={accommodation.minReservationDays}
					maxDays={accommodation.maxReservationDays}
					numberOfMonths={1}
					{isDateUnavailable}
					onValueChange={onRangeChange}
				/>
				<div class="border-t px-3 py-2 text-center text-xs text-muted-foreground">
					Minimum stay {accommodation.minReservationDays} nights
				</div>
			</Popover.Content>
		</Popover.Root>

		<Popover.Root bind:open={guestsOpen}>
			<Popover.Trigger>
				{#snippet child({ props })}
					<button
						{...props}
						type="button"
						class="flex w-full flex-col px-3.5 py-2.5 text-left transition-colors hover:bg-muted/40"
					>
						<span class="text-[0.7rem] font-semibold tracking-wide uppercase text-muted-foreground">
							Guests
						</span>
						<span class="text-sm">{formatGuestsShort(adults, children)}</span>
					</button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-72 p-4" align="end">
				<div class="space-y-4">
					{#snippet stepper(
						label: string,
						hint: string,
						value: number,
						onDec: () => void,
						onInc: () => void,
						canDec: boolean,
						canInc: boolean
					)}
						<div class="flex items-center justify-between gap-4">
							<div>
								<p class="text-sm font-medium">{label}</p>
								<p class="text-xs text-muted-foreground">{hint}</p>
							</div>
							<div class="flex items-center gap-3">
								<Button
									variant="outline"
									size="icon-sm"
									class="rounded-full"
									disabled={!canDec}
									onclick={onDec}
									aria-label={`Decrease ${label}`}
								>
									<MinusIcon />
								</Button>
								<span class="w-4 text-center text-sm tabular-nums">{value}</span>
								<Button
									variant="outline"
									size="icon-sm"
									class="rounded-full"
									disabled={!canInc}
									onclick={onInc}
									aria-label={`Increase ${label}`}
								>
									<PlusIcon />
								</Button>
							</div>
						</div>
					{/snippet}

					{@render stepper(
						'Adults',
						'Age 13+',
						adults,
						() => (adults = Math.max(1, adults - 1)),
						() => {
							if (totalGuests < accommodation.maxGuests) adults += 1;
						},
						adults > 1,
						totalGuests < accommodation.maxGuests
					)}
					<Separator />
					{@render stepper(
						'Children',
						'Ages 2–12',
						children,
						() => (children = Math.max(0, children - 1)),
						() => {
							if (totalGuests < accommodation.maxGuests) children += 1;
						},
						children > 0,
						totalGuests < accommodation.maxGuests
					)}

					<p class="text-xs text-muted-foreground">
						This place allows up to {accommodation.maxGuests} guests.
					</p>
				</div>
			</Popover.Content>
		</Popover.Root>
	</div>

	<Button size="lg" class="h-11 w-full text-base" onclick={reserve}>
		{accommodation.instantBooking ? 'Reserve' : 'Request to book'}
	</Button>

	<p class="text-center text-xs text-muted-foreground">You won’t be charged yet</p>

	<!-- Price breakdown -->
	{#if nights > 0}
		<div class="space-y-2.5 text-sm">
			<div class="flex items-center justify-between">
				<span class="text-muted-foreground underline underline-offset-2">
					{formatCurrency(quote.nightly)} × {nights} {nights === 1 ? 'night' : 'nights'}
				</span>
				<span class="tabular-nums">{formatCurrency(quote.accommodationTotal)}</span>
			</div>
			{#if quote.cleaningFee > 0}
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground underline underline-offset-2">Cleaning fee</span>
					<span class="tabular-nums">{formatCurrency(quote.cleaningFee)}</span>
				</div>
			{/if}
			<Separator />
			<div class="flex items-center justify-between text-base font-semibold">
				<span>Total</span>
				<span class="tabular-nums">{formatCurrency(quote.total)}</span>
			</div>
		</div>
	{/if}

	<div class="flex items-center justify-center gap-4 border-t pt-3 text-xs text-muted-foreground">
		{#if accommodation.instantBooking}
			<span class="flex items-center gap-1.5">
				<ZapIcon class="size-3.5" aria-hidden="true" />
				Instant booking
			</span>
		{/if}
		<span class="flex items-center gap-1.5">
			<BanknoteIcon class="size-3.5" aria-hidden="true" />
			Pay with cash at check-in
		</span>
	</div>
</div>
