<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';
	import CopyButton from '@/shared/components/ui/copy-button/copy-button.svelte';
	import BookingsStatus from '@/features/bookings/components/bookings-status.svelte';

	// UTILS
	import { appHref } from '@/utils/app-navigation';
	import { formatCurrency, formatDate, formatGuestsShort } from '@/utils/formatters';

	// DATA
	import { paymentMethodLabel } from '@/features/bookings/data/paymentMethods';

	// TYPES
	import type { typesReservationBooking } from '@/shared/features/booking/types/bookingTypes';

	// LUCIDE ICONS
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import MailIcon from '@lucide/svelte/icons/mail';

	let { booking }: { booking: typesReservationBooking } = $props();

	const listingHref = $derived(
		UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION.replace(':slug', booking.apartmentSlug)
	);

	// Drive the page off the booking's real status, not the listing's instant-book flag — so a
	// later host approval/decline (or a completed/cancelled stay) shows the right state on revisit.
	// `checked_in`/`checked_out` fold into the "booked" view; only pending and cancelled differ.
	const statusView = $derived.by(() => {
		switch (booking.status) {
			case 'pending':
				return {
					icon: ClockIcon,
					iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
					title: m['ReservationPage.ReservationConfirmation.pendingTitle'](),
					description: m['ReservationPage.ReservationConfirmation.pendingDescription']({
						hostName: booking.hostName
					})
				};
			case 'declined':
				return {
					icon: CircleXIcon,
					iconClass: 'bg-destructive/10 text-destructive',
					title: m['ReservationPage.ReservationConfirmation.declinedTitle'](),
					description: m['ReservationPage.ReservationConfirmation.declinedDescription']({
						hostName: booking.hostName
					})
				};
			case 'auto_declined':
				return {
					icon: CircleXIcon,
					iconClass: 'bg-muted text-muted-foreground',
					title: m['ReservationPage.ReservationConfirmation.expiredTitle'](),
					description: m['ReservationPage.ReservationConfirmation.expiredDescription']()
				};
			case 'cancelled':
				return {
					icon: CircleXIcon,
					iconClass: 'bg-destructive/10 text-destructive',
					title: m['ReservationPage.ReservationConfirmation.cancelledTitle'](),
					description: m['ReservationPage.ReservationConfirmation.cancelledDescription']({
						accommodationTitle: booking.apartmentTitle,
						hostName: booking.hostName
					})
				};
			default:
				return {
					icon: CircleCheckIcon,
					iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
					title: m['ReservationPage.ReservationConfirmation.bookedTitle'](),
					description: m['ReservationPage.ReservationConfirmation.bookedDescription']({
						accommodationTitle: booking.apartmentTitle
					})
				};
		}
	});
	const StatusIcon = $derived(statusView.icon);
</script>

<div class="mx-auto max-w-lg py-10 text-center sm:py-16">
	<div
		class={`mx-auto flex size-14 items-center justify-center rounded-full ${statusView.iconClass}`}
	>
		<StatusIcon class="size-8" aria-hidden="true" />
	</div>

	<h1 class="mt-5 text-2xl font-semibold tracking-tight">{statusView.title}</h1>
	<p class="mt-2 text-sm text-muted-foreground">{statusView.description}</p>

	<div class="mt-6 space-y-4 rounded-2xl border p-5 text-left sm:p-6">
		<!-- The code is the one thing the guest needs later (check-in, support), so it's the hero
		     of the card: large, mono, letter-spaced, and one tap to copy. -->
		<div class="rounded-xl border border-dashed bg-muted/30 px-4 py-4 text-center">
			<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				{m['ReservationPage.ReservationConfirmation.confirmationCode']()}
			</p>

			<div class="mt-2 flex items-center justify-center gap-2.5">
				<span class="font-mono text-2xl font-bold tracking-[0.25em] text-foreground">
					{booking.bookingCode}
				</span>

				<CopyButton
					value={booking.bookingCode}
					label={m['ReservationPage.ReservationConfirmation.copyConfirmationCode']()}
				/>
			</div>
		</div>

		<dl class="space-y-2 text-sm">
			<div class="flex items-center justify-between gap-3">
				<dt class="text-muted-foreground">{m['ReservationPage.ReservationConfirmation.status']()}</dt>
				<dd class="text-right">
					<BookingsStatus kind="booking" status={booking.status} />
				</dd>
			</div>

			<div class="flex items-center justify-between gap-3">
				<dt class="text-muted-foreground">{m['ReservationPage.ReservationConfirmation.stay']()}</dt>
				<dd class="text-right font-medium">{booking.apartmentTitle}</dd>
			</div>

			<div class="flex items-center justify-between gap-3">
				<dt class="text-muted-foreground">{m['ReservationPage.ReservationConfirmation.checkIn']()}</dt>
				<dd class="text-right font-medium">{formatDate(booking.checkInDate)}</dd>
			</div>

			<div class="flex items-center justify-between gap-3">
				<dt class="text-muted-foreground">{m['ReservationPage.ReservationConfirmation.checkOut']()}</dt>
				<dd class="text-right font-medium">{formatDate(booking.checkOutDate)}</dd>
			</div>

			<div class="flex items-center justify-between gap-3">
				<dt class="text-muted-foreground">{m['ReservationPage.ReservationConfirmation.guests']()}</dt>
				<dd class="text-right font-medium">
					{formatGuestsShort(booking.numberOfAdults, booking.numberOfChildren)}
				</dd>
			</div>

			<div class="flex items-center justify-between gap-3">
				<dt class="text-muted-foreground">
					{m['ReservationPage.ReservationConfirmation.totalWithPayment']({
						paymentMethod: paymentMethodLabel(booking.paymentMethod)
					})}
				</dt>
				<dd class="text-right font-semibold tabular-nums">{formatCurrency(booking.total)}</dd>
			</div>
		</dl>
	</div>

	{#if booking.status !== 'cancelled' && booking.status !== 'declined' && booking.status !== 'auto_declined'}
		<p class="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
			<MailIcon class="size-4" aria-hidden="true" />
			{m['ReservationPage.ReservationConfirmation.emailCopySent']({ email: booking.guestEmail })}
		</p>
	{/if}

	<div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
		<Button href={appHref(listingHref)} variant="outline">
			{m['ReservationPage.ReservationConfirmation.backToListing']()}
		</Button>

		<Button href={appHref(UNPROTECTED_PAGE_ENDPOINTS.ROOT)}>
			{m['ReservationPage.ReservationConfirmation.browseMoreStays']()}
		</Button>
	</div>
</div>
