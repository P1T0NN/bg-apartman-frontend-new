<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import CopyButton from '@/components/ui/copy-button/copy-button.svelte';
	import { FeatureStatus } from '@/components/ui/feature-status/index.js';
	import GuestBookingActions from '@/features/bookings/components/guest-booking-actions.svelte';
	import GuestStayConfirmation from '@/features/bookings/components/guest-stay-confirmation.svelte';

	// UTILS
	import { isTerminalBookingStatus } from '@/shared/features/booking/utils/isTerminalBookingStatus';

	// DATA
	import {
		BOOKING_STATUS_CONFIG,
		BOOKING_STATUS_HELP
	} from '@/features/bookings/data/bookingsData';

	// UTILS
	import { appHref } from '@/utils/app-navigation';
	import { formatCurrency, formatDate, formatGuestsShort } from '@/utils/formatters';

	// DATA
	import { paymentMethodLabel } from '@/features/bookings/utils/paymentMethodLabel';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { typesReservationBooking } from '@/shared/features/booking/types/bookingTypes';

	// LUCIDE ICONS
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import MailIcon from '@lucide/svelte/icons/mail';

	let { bookingId, booking }: { bookingId: Id<'bookings'>; booking: typesReservationBooking } =
		$props();

	/** Terminal = the stay is over or never happened; drives "Book again" vs "Back to". */
	const isClosed = $derived(isTerminalBookingStatus(booking.status));

	const accommodationHref = $derived(
		UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION.replace(':slug', booking.apartmentSlug)
	);

	/**
	 * One sentence and at most one action per status — the guest never sees the machine
	 * (GuestSystemDesign.md §0.3/§3). Every one of the eight statuses is handled explicitly:
	 * a new status upstream must fail loudly here rather than fall into a vague default.
	 */
	const statusView = $derived.by(() => {
		switch (booking.status) {
			case 'pending':
				return {
					icon: ClockIcon,
					iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
					title: 'Request sent!',
					description: `${booking.hostName} has ${booking.policy.hostResponseHours} hours to respond. You won't be charged unless it's confirmed.`
				};
			case 'confirmed':
				return {
					icon: CircleCheckIcon,
					iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
					title: 'Your stay is booked!',
					description: `You're all set for ${booking.apartmentTitle}. We've emailed your confirmation details.`
				};
			case 'checked_in':
				return {
					icon: CircleCheckIcon,
					iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
					title: "You're checked in",
					description: `Enjoy your stay at ${booking.apartmentTitle}. Anything you need, ${booking.hostName} is your contact.`
				};
			case 'checked_out':
				return {
					icon: CircleCheckIcon,
					iconClass: 'bg-muted text-muted-foreground',
					title: 'Stay complete',
					description: `Hope you enjoyed ${booking.apartmentTitle}. Thanks for staying with us.`
				};
			case 'declined':
				return {
					icon: CircleXIcon,
					iconClass: 'bg-destructive/10 text-destructive',
					title: "The host couldn't take this one",
					description:
						booking.cancelReason ??
						`${booking.hostName} couldn't accept this request. The dates were never reserved.`
				};
			case 'auto_declined':
				return {
					icon: CircleXIcon,
					iconClass: 'bg-muted text-muted-foreground',
					title: 'Request closed',
					description: `${booking.cancelReason ?? "The host didn't respond in time."} Nothing was charged — you can request other dates any time.`
				};
			case 'withdrawn':
				return {
					icon: CircleXIcon,
					iconClass: 'bg-muted text-muted-foreground',
					title: 'You withdrew this request',
					description: `Nothing was reserved and nothing was charged. ${booking.apartmentTitle} is still there when you want it.`
				};
			case 'cancelled':
				return {
					icon: CircleXIcon,
					iconClass: 'bg-destructive/10 text-destructive',
					title: cancelledByLabel,
					description:
						booking.cancelReason ??
						`This booking for ${booking.apartmentTitle} was cancelled. If that's unexpected, reach out to ${booking.hostName}.`
				};
		}
	});
	const StatusIcon = $derived(statusView.icon);

	// Who ended it matters to the guest — "you cancelled" and "the host cancelled" are very
	// different messages to receive.
	const cancelledByLabel = $derived.by(() => {
		switch (booking.cancelledBy) {
			case 'guest':
				return 'You cancelled this booking';
			case 'host':
				return 'The host cancelled this booking';
			case 'admin':
				return 'Support cancelled this booking';
			default:
				return 'Reservation cancelled';
		}
	});

	/** Money state in guest words — never merged with the stay's status. */
	const paymentLine = $derived.by(() => {
		switch (booking.paymentStatus) {
			case 'on_arrival':
				return `Pay ${formatCurrency(booking.total)} in cash at the property.`;
			case 'awaiting':
				return 'Finalising your payment…';
			case 'authorized':
				return `Your card is held for ${formatCurrency(booking.total)} — you're only charged if the host confirms.`;
			case 'paid':
				return `Paid ${formatCurrency(booking.total)}.`;
			case 'released':
				return 'The hold on your card was released. You were not charged.';
			case 'refunded':
				return `Refunded ${formatCurrency(booking.total)}.`;
		}
	});
</script>

<div class="mx-auto max-w-lg py-10 text-center sm:py-16">
	<div
		class={`mx-auto flex size-14 items-center justify-center rounded-full ${statusView.iconClass}`}
	>
		<StatusIcon class="size-8" aria-hidden="true" />
	</div>

	<h1 class="mt-5 text-2xl font-semibold tracking-tight">{statusView.title}</h1>
	<p class="mt-2 text-sm text-muted-foreground">{statusView.description}</p>

	<GuestStayConfirmation {bookingId} {booking} />

	<div class="mt-6 space-y-4 rounded-2xl border p-5 text-left sm:p-6">
		<!-- The code is the one thing the guest needs later (check-in, support), so it's the hero
		     of the card: large, mono, letter-spaced, and one tap to copy. -->
		<div class="rounded-xl border border-dashed bg-muted/30 px-4 py-4 text-center">
			<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
				Confirmation code
			</p>

			<div class="mt-2 flex items-center justify-center gap-2.5">
				<span class="font-mono text-2xl font-bold tracking-[0.25em] text-foreground">
					{booking.bookingCode}
				</span>

				<CopyButton value={booking.bookingCode} label="Copy confirmation code" />
			</div>
		</div>

		<dl class="space-y-2 text-sm">
			<div class="flex items-center justify-between gap-3">
				<dt class="text-muted-foreground">Status</dt>
				<dd class="text-right">
					<FeatureStatus
						config={BOOKING_STATUS_CONFIG}
						status={booking.status}
						help={BOOKING_STATUS_HELP}
					/>
				</dd>
			</div>

			<div class="flex items-center justify-between gap-3">
				<dt class="text-muted-foreground">Stay</dt>
				<dd class="text-right font-medium">{booking.apartmentTitle}</dd>
			</div>

			<div class="flex items-center justify-between gap-3">
				<dt class="text-muted-foreground">Check-in</dt>
				<dd class="text-right font-medium">{formatDate(booking.checkInDate)}</dd>
			</div>

			<div class="flex items-center justify-between gap-3">
				<dt class="text-muted-foreground">Check-out</dt>
				<dd class="text-right font-medium">{formatDate(booking.checkOutDate)}</dd>
			</div>

			<div class="flex items-center justify-between gap-3">
				<dt class="text-muted-foreground">Guests</dt>
				<dd class="text-right font-medium">
					{formatGuestsShort(booking.numberOfAdults, booking.numberOfChildren)}
				</dd>
			</div>

			<div class="flex items-center justify-between gap-3">
				<dt class="text-muted-foreground">
					Total ({paymentMethodLabel(booking.paymentMethod)})
				</dt>
				<dd class="text-right font-semibold tabular-nums">{formatCurrency(booking.total)}</dd>
			</div>
		</dl>

		<!-- Money state, always shown and always separate from the stay's status. -->
		<p class="mt-3 border-t pt-3 text-left text-xs text-muted-foreground">{paymentLine}</p>
	</div>

	{#if !isClosed}
		<p class="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
			<MailIcon class="size-4" aria-hidden="true" />
			A copy was sent to {booking.guestEmail}
		</p>
	{/if}

	<div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
		<!-- A delisted stay must not send the guest to a dead page. -->
		{#if booking.apartmentIsBookable}
			<Button href={appHref(accommodationHref)} variant="outline">
				{isClosed ? 'Book again' : 'Back to accommodation'}
			</Button>
		{/if}

		<Button href={appHref(UNPROTECTED_PAGE_ENDPOINTS.ROOT)}>Browse more stays</Button>

		<GuestBookingActions {bookingId} {booking} />
	</div>
</div>
