<script lang="ts">
	// COMPONENTS
	import { NativeSheet } from '@/shared/components/ui/native-sheet/index.js';
	import { Separator } from '@/shared/components/ui/separator/index.js';
	import { Button } from '@/shared/components/ui/button/index.js';
	import BookingsStatus from '../bookings-status.svelte';

	// UTILS
	import { PAYMENT_STATUS_CONFIG } from '@/features/bookings/data/bookingsData';
	import { availableBookingActions } from '@/features/bookings/utils/availableBookingActions';
	import {
		formatAdultsAndChildren,
		formatCurrency,
		formatDateWithWeekday,
		formatNights
	} from '@/utils/formatters';
	import { initials } from '@/shared/utils/stringUtils';

	// TYPES
	import type {
		typesBookingSafe,
		typesBookingAction
	} from '@/shared/features/booking/types/bookingTypes';

	// LUCIDE ICONS
	import MailIcon from '@lucide/svelte/icons/mail';
	import PhoneIcon from '@lucide/svelte/icons/phone';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import UsersIcon from '@lucide/svelte/icons/users';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import BanIcon from '@lucide/svelte/icons/ban';

	function guestName(b: typesBookingSafe): string {
		return `${b.guestFirstName} ${b.guestLastName}`;
	}

	let {
		booking,
		open = $bindable(false),
		onAction,
		getActions = availableBookingActions,
		hostName
	}: {
		booking: typesBookingSafe | null;
		open?: boolean;
		onAction?: (booking: typesBookingSafe, action: typesBookingAction) => void;
		/** Override the per-status action set (admin context offers cancel only). */
		getActions?: typeof availableBookingActions;
		/** Host label shown under the property — admin context only. */
		hostName?: string;
	} = $props();

	const actions = $derived(booking && onAction ? getActions(booking.status) : []);

	function runAction(action: typesBookingAction) {
		if (!booking || !onAction) return;
		onAction(booking, action);
		open = false;
	}
</script>

<NativeSheet
	bind:open
	side="right"
	title="Booking details"
	class="w-full max-w-none gap-0 bg-background sm:max-w-md"
>
	{#if booking}
		{@const payment = PAYMENT_STATUS_CONFIG[booking.paymentStatus]}

		<header class="flex flex-col gap-3 border-b p-4">
			<div class="flex items-start gap-3 pr-8">
				<div
					class="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground ring-1 ring-border"
					aria-hidden="true"
				>
					{initials(guestName(booking))}
				</div>
				<div class="min-w-0 flex-1">
					<h2 class="truncate text-base font-semibold">{guestName(booking)}</h2>
					<p class="font-mono text-xs text-muted-foreground">{booking.bookingCode}</p>
				</div>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<BookingsStatus kind="booking" status={booking.status} />
				<BookingsStatus kind="payment" status={booking.paymentStatus} />
			</div>
		</header>

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
							<span class="text-[0.7rem] whitespace-nowrap"
								>{formatNights(booking.numberOfNights)}</span
							>
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
						<span
							>{formatAdultsAndChildren(booking.numberOfAdults, booking.numberOfChildren)}</span
						>
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
							{#if hostName}
								<p class="truncate text-xs text-muted-foreground">Host: {hostName}</p>
							{/if}
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
							<SparklesIcon
								class="mt-0.5 size-4 shrink-0 text-muted-foreground"
								aria-hidden="true"
							/>
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
							<span
								>{formatCurrency(booking.subtotal / booking.numberOfNights)} ├ù {formatNights(
									booking.numberOfNights
								)}</span
							>
							<span class="text-foreground tabular-nums">{formatCurrency(booking.subtotal)}</span>
						</div>
						<div class="flex items-center justify-between py-1 text-muted-foreground">
							<span>Cleaning fee</span>
							<span class="text-foreground tabular-nums"
								>{formatCurrency(booking.cleaningFee)}</span
							>
						</div>
						<Separator class="my-2" />
						<div class="flex items-center justify-between py-1 font-semibold">
							<span>Total ({payment.label.toLowerCase()})</span>
							<span class="tabular-nums">{formatCurrency(booking.total)}</span>
						</div>
					</div>
				</section>

				<!-- Cancellation -->
				{#if booking.status === 'cancelled' || booking.status === 'declined' || booking.status === 'auto_declined'}
					<section
						class="flex gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm"
					>
						<BanIcon class="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
						<div class="space-y-0.5">
							<p class="font-medium text-destructive">
								{#if booking.status === 'declined'}
									Declined by host
								{:else if booking.status === 'auto_declined'}
									Request expired
								{:else}
									Cancelled by {booking.cancelledBy ?? 'guest'}
								{/if}
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
			<footer class="mt-auto flex flex-row gap-2 border-t p-4">
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
			</footer>
		{/if}
	{/if}
</NativeSheet>
