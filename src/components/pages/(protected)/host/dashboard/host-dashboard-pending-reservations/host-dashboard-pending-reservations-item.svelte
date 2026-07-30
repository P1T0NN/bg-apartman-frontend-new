<script lang="ts">
	// COMPONENTS
	import BookingExpiryBadge from '@/features/bookings/components/booking-expiry-badge.svelte';

	// UTILS
	import { formatCurrency, formatDateRange, formatGuestsShort } from '@/utils/formatters';

	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	/**
	 * One row of the dashboard's pending-requests strip: who, which listing, when, and how
	 * long the host has left to answer.
	 *
	 * Read-only by design — confirming and declining happen on the reservations page, where
	 * the dialogs that name each action's consequence live. This row's job is to make a
	 * waiting request impossible to miss, then hand off.
	 */
	let { booking }: { booking: typesBookingSafe } = $props();
</script>

<li class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
	{#if booking.apartment.imageUrl}
		<img
			src={booking.apartment.imageUrl}
			alt=""
			class="size-14 shrink-0 rounded-lg object-cover ring-1 ring-border"
			loading="lazy"
		/>
	{:else}
		<div class="size-14 shrink-0 rounded-lg bg-muted"></div>
	{/if}

	<div class="min-w-0 flex-1">
		<div class="flex items-center gap-2">
			<p class="truncate text-sm font-medium">
				{booking.guestFirstName}
				{booking.guestLastName}
			</p>

			<!-- Renders nothing when the booking has no deadline, so no guard is needed here. -->
			<BookingExpiryBadge expiresAt={booking.pendingExpiresAt} />
		</div>

		<p class="truncate text-xs text-muted-foreground">{booking.apartment.title}</p>
		<p class="truncate text-xs text-muted-foreground">
			{formatDateRange(booking.checkInDate, booking.checkOutDate)}
			· {formatGuestsShort(booking.numberOfAdults, booking.numberOfChildren)}
			· {formatCurrency(booking.total)}
		</p>
	</div>
</li>
