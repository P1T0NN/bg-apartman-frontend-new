<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { formatCurrency, formatDate, formatGuestsShort } from '@/utils/formatters';
	import { appHref } from '@/utils/app-navigation';
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';
	import { isTerminalBookingStatus } from '@/shared/features/booking/utils/isTerminalBookingStatus';
	import { PAYMENT_FLAG_COPY } from '@/features/bookings/data/paymentFlags';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { AdminBookingRow } from '@/convex/tables/bookings/queries/listBookingsAdmin';

	// LUCIDE ICONS
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	/**
	 * Everything a support answer needs, in place (AdminPagesSystemDesign.md §3). This is
	 * why no `/admin/bookings/[id]` route exists: a detail page would carry these same
	 * fields and cost a navigation to reach them.
	 *
	 * Money numbers come from the booking's own price SNAPSHOT, never live config — a fee
	 * or price change must never repaint a stay that already happened
	 * (AccommodationsSystemDesign.md §8's "money facts are snapshots").
	 */
	// `onCancel` is a prop because the dialog it opens lives in the table (one dialog, any row);
	// clearing a flag opens nothing, so it stays here with the button that triggers it.
	let { booking, onCancel }: {
		booking: AdminBookingRow;
		onCancel: (row: AdminBookingRow) => void;
	} = $props();

	const convex = useConvexClient();

	const flagCopy = $derived(booking.paymentFlag ? PAYMENT_FLAG_COPY[booking.paymentFlag] : null);

	/**
	 * Clearing a flag is a statement of fact ("I finished this in the provider dashboard"),
	 * not an action on money — nothing is charged, refunded or transferred here
	 * (PaymentsSystemDesign.md §4/§6). Reversible in effect (the reconciliation cron will
	 * re-flag anything genuinely unresolved), so no confirm dialog.
	 */
	async function clearFlag() {
		const result = await safeMutation(
			convex,
			api.tables.bookings.mutations.clearPaymentFlag.clearPaymentFlag,
			{ bookingId: booking._id as Id<'bookings'> }
		);
		toastResult(result);
	}

	// The same shared guard the backend enforces — never a second definition of "terminal".
	const isTerminal = $derived(isTerminalBookingStatus(booking.status));
</script>

<div class="flex flex-col gap-4 text-sm">
	{#if flagCopy}
		<!-- The flag says only that reality and our record may have diverged; the payment
		     state itself is still the last TRUE value (PaymentsSystemDesign.md §4). -->
		<div
			class="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
		>
			<TriangleAlertIcon
				class="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
				aria-hidden="true"
			/>
			<div class="min-w-0 flex-1">
				<p class="font-medium">{flagCopy.title}</p>
				<p class="text-xs text-muted-foreground">{flagCopy.body}</p>
			</div>
			<Button variant="outline" size="sm" class="shrink-0" onclick={clearFlag}>
				Mark handled
			</Button>
		</div>
	{/if}

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<section class="flex flex-col gap-1.5">
			<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Guest</h3>
			<p class="font-medium">{booking.guestFirstName} {booking.guestLastName}</p>
			<a href={`mailto:${booking.guestEmail}`} class="text-primary hover:underline">
				{booking.guestEmail}
			</a>
			<a href={`tel:${booking.guestPhone}`} class="text-primary hover:underline">
				{booking.guestPhone}
			</a>
		</section>

		<section class="flex flex-col gap-1.5">
			<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Stay</h3>
			<p>{formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}</p>
			<p class="text-muted-foreground">
				{booking.numberOfNights} night{booking.numberOfNights === 1 ? '' : 's'} ·
				{formatGuestsShort(booking.numberOfAdults, booking.numberOfChildren)}
			</p>
			<p class="text-muted-foreground">Host: {booking.hostName}</p>
		</section>

		<section class="flex flex-col gap-1">
			<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Price</h3>
			<div class="flex justify-between gap-3">
				<span class="text-muted-foreground">Subtotal</span>
				<span class="tabular-nums">{formatCurrency(booking.subtotal)}</span>
			</div>
			<div class="flex justify-between gap-3">
				<span class="text-muted-foreground">Cleaning</span>
				<span class="tabular-nums">{formatCurrency(booking.cleaningFee)}</span>
			</div>
			{#if booking.platformFee > 0}
				<div class="flex justify-between gap-3">
					<span class="text-muted-foreground">Service fee</span>
					<span class="tabular-nums">{formatCurrency(booking.platformFee)}</span>
				</div>
			{/if}
			<div class="flex justify-between gap-3 border-t pt-1 font-semibold">
				<span>Total</span>
				<span class="tabular-nums">{formatCurrency(booking.total)}</span>
			</div>
		</section>
	</div>

	{#if booking.specialRequests}
		<section class="flex flex-col gap-1">
			<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
				Special requests
			</h3>
			<p class="wrap-break-word text-muted-foreground">{booking.specialRequests}</p>
		</section>
	{/if}

	{#if booking.cancelledAt}
		<section class="flex flex-col gap-1">
			<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
				Cancellation
			</h3>
			<p class="text-muted-foreground">
				{booking.cancelledBy === 'system' ? 'Automatic' : `By the ${booking.cancelledBy}`}
				on {formatDate(new Date(booking.cancelledAt).toISOString().slice(0, 10))}
				{#if booking.lateCancellation}
					· late cancellation (payment kept by the host)
				{/if}
			</p>
			{#if booking.cancelReason}
				<p class="wrap-break-word">{booking.cancelReason}</p>
			{/if}
		</section>
	{/if}

	<div class="flex flex-wrap items-center gap-2 border-t pt-3">
		<Button
			href={appHref(
				UNPROTECTED_PAGE_ENDPOINTS.RESERVATION.replace(':id', String(booking._id))
			)}
			target="_blank"
			rel="noopener"
			variant="outline"
			size="sm"
		>
			Open guest reservation page
		</Button>

		<!-- The emergency brake. Terminal bookings are past intervening with — nothing
		     transitions out of a terminal state, including admins (BSD §2). -->
		{#if !isTerminal}
			<Button variant="destructive" size="sm" onclick={() => onCancel(booking)}>
				Cancel booking
			</Button>
		{/if}
	</div>
</div>
