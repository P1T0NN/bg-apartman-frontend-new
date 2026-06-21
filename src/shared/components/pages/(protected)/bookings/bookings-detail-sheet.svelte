<script lang="ts">
	// COMPONENTS
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle,
		SheetFooter
	} from '@/shared/components/ui/sheet/index.js';
	import { Separator } from '@/shared/components/ui/separator/index.js';
	import { Button } from '@/shared/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/shared/utils/utils.js';
	import {
		BOOKING_STATUS_CONFIG,
		PAYMENT_STATUS_CONFIG,
		availableActions,
		formatCurrency,
		formatDateWithWeekday,
		formatGuests,
		formatNights,
		guestFullName,
		guestInitials
	} from '@/features/bookings/utils/bookingsPresentation';

	// LUCIDE ICONS
	import MailIcon from '@lucide/svelte/icons/mail';
	import PhoneIcon from '@lucide/svelte/icons/phone';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import UsersIcon from '@lucide/svelte/icons/users';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import BanIcon from '@lucide/svelte/icons/ban';

	// TYPES
	import type { BookingRecord } from '@/features/bookings/data/bookingsDummyData';
	import type { BookingAction } from '@/features/bookings/utils/bookingsPresentation';

	let {
		booking,
		open = $bindable(false),
		onAction
	}: {
		booking: BookingRecord | null;
		open?: boolean;
		onAction: (booking: BookingRecord, action: BookingAction) => void;
	} = $props();

	const actions = $derived(booking ? availableActions(booking.status) : []);

	function runAction(action: BookingAction) {
		if (!booking) return;
		onAction(booking, action);
		open = false;
	}
</script>

<Sheet bind:open>
	<SheetContent class="w-full gap-0 sm:max-w-md" side="right">
		{#if booking}
			{@const status = BOOKING_STATUS_CONFIG[booking.status]}
			{@const payment = PAYMENT_STATUS_CONFIG[booking.paymentStatus]}

			<SheetHeader class="gap-3 border-b">
				<div class="flex items-start gap-3 pr-8">
					<div
						class="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground ring-1 ring-border"
						aria-hidden="true"
					>
						{guestInitials(booking)}
					</div>
					<div class="min-w-0 flex-1">
						<SheetTitle class="truncate text-base">{guestFullName(booking)}</SheetTitle>
						<p class="font-mono text-xs text-muted-foreground">{booking.bookingCode}</p>
					</div>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<span
						class={cn(
							'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1',
							status.badgeClass
						)}
					>
						{status.label}
					</span>
					<span
						class={cn(
							'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1',
							payment.badgeClass
						)}
					>
						{payment.label}
					</span>
				</div>
			</SheetHeader>

			<div class="flex-1 overflow-y-auto">
				<div class="flex flex-col gap-5 p-4">
					<!-- Stay timeline -->
					<section class="rounded-lg border bg-muted/30 p-3">
						<div class="flex items-center justify-between gap-2">
							<div>
								<p class="text-xs text-muted-foreground">Check-in</p>
								<p class="text-sm font-semibold">{formatDateWithWeekday(booking.checkInDate)}</p>
							</div>
							<div class="flex flex-col items-center text-muted-foreground">
								<span class="text-[0.7rem] whitespace-nowrap">{formatNights(booking.numberOfNights)}</span>
								<ArrowRightIcon class="size-4" aria-hidden="true" />
							</div>
							<div class="text-right">
								<p class="text-xs text-muted-foreground">Check-out</p>
								<p class="text-sm font-semibold">{formatDateWithWeekday(booking.checkOutDate)}</p>
							</div>
						</div>
						<Separator class="my-3" />
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<UsersIcon class="size-4 shrink-0" aria-hidden="true" />
							<span>{formatGuests(booking)}</span>
						</div>
					</section>

					<!-- Property -->
					<section class="space-y-2">
						<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
							Property
						</h3>
						<div class="flex items-center gap-3">
							<img
								src={booking.apartment.imageUrl}
								alt={booking.apartment.title}
								class="size-12 shrink-0 rounded-md object-cover ring-1 ring-border"
								loading="lazy"
							/>
							<div class="min-w-0">
								<p class="truncate text-sm font-medium">{booking.apartment.title}</p>
								<p class="flex items-center gap-1 truncate text-xs text-muted-foreground">
									<MapPinIcon class="size-3 shrink-0" aria-hidden="true" />
									{booking.apartment.city}
								</p>
							</div>
						</div>
					</section>

					<!-- Guest contact -->
					<section class="space-y-2">
						<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
							Guest contact
						</h3>
						<div class="grid gap-2">
							<a
								href={`mailto:${booking.guestEmail}`}
								class="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted"
							>
								<MailIcon class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
								<span class="truncate">{booking.guestEmail}</span>
							</a>
							<a
								href={`tel:${booking.guestPhone.replace(/\s+/g, '')}`}
								class="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted"
							>
								<PhoneIcon class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
								<span class="truncate">{booking.guestPhone}</span>
							</a>
						</div>
					</section>

					<!-- Special requests -->
					{#if booking.specialRequests}
						<section class="space-y-2">
							<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
								Special requests
							</h3>
							<div class="flex gap-2.5 rounded-lg border border-dashed bg-muted/20 p-3 text-sm">
								<SparklesIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
								<p class="leading-relaxed text-foreground/90">{booking.specialRequests}</p>
							</div>
						</section>
					{/if}

					<!-- Price breakdown -->
					<section class="space-y-2">
						<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
							Price breakdown
						</h3>
						<div class="rounded-lg border p-3 text-sm">
							<div class="flex items-center justify-between py-1 text-muted-foreground">
								<span>{formatCurrency(booking.subtotal / booking.numberOfNights)} × {formatNights(booking.numberOfNights)}</span>
								<span class="tabular-nums text-foreground">{formatCurrency(booking.subtotal)}</span>
							</div>
							<div class="flex items-center justify-between py-1 text-muted-foreground">
								<span>Cleaning fee</span>
								<span class="tabular-nums text-foreground">{formatCurrency(booking.cleaningFee)}</span>
							</div>
							<Separator class="my-2" />
							<div class="flex items-center justify-between py-1 font-semibold">
								<span>Total ({payment.label.toLowerCase()})</span>
								<span class="tabular-nums">{formatCurrency(booking.total)}</span>
							</div>
						</div>
					</section>

					<!-- Cancellation -->
					{#if booking.status === 'cancelled'}
						<section
							class="flex gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm"
						>
							<BanIcon class="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
							<div class="space-y-0.5">
								<p class="font-medium text-destructive">
									Cancelled by {booking.cancelledBy ?? 'guest'}
								</p>
								{#if booking.cancelReason}
									<p class="text-muted-foreground">{booking.cancelReason}</p>
								{/if}
							</div>
						</section>
					{/if}
				</div>
			</div>

			{#if actions.length > 0}
				<SheetFooter class="flex-row gap-2 border-t">
					{#each actions as { action, meta } (action)}
						<Button
							variant={meta.variant}
							size="lg"
							class="flex-1"
							onclick={() => runAction(action)}
						>
							{meta.label}
						</Button>
					{/each}
				</SheetFooter>
			{/if}
		{/if}
	</SheetContent>
</Sheet>
