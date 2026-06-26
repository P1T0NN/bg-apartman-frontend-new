<script lang="ts">
	// CONFIG
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';
	import { Separator } from '@/shared/components/ui/separator/index.js';

	// UTILS
	import { formatDateRange, nightsBetween } from '@/shared/utils/dateUtils';
	import { calculatePrice } from '@/shared/features/pricing/utils/calculatePrice';
	import { formatCurrency, formatGuestsShort } from '@/shared/utils/formatters';
	import { paymentMethodLabel } from '@/features/bookings/data/paymentMethods';

	// LUCIDE ICONS
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import MailIcon from '@lucide/svelte/icons/mail';

	// TYPES
	import type { AccommodationDetail } from '@/features/accommodations/data/accommodationDummyData';
	import type { PaymentMethod } from '@/features/bookings/data/paymentMethods';

	let {
		accommodation,
		bookingCode,
		guestEmail,
		checkIn,
		checkOut,
		adults,
		children,
		paymentMethod,
		listingHref
	}: {
		accommodation: AccommodationDetail;
		bookingCode: string;
		guestEmail: string;
		checkIn: string | null;
		checkOut: string | null;
		adults: number;
		children: number;
		paymentMethod: PaymentMethod;
		listingHref: string;
	} = $props();

	const nights = $derived(nightsBetween(checkIn, checkOut));
	const quote = $derived(calculatePrice(accommodation, nights));
	const confirmed = $derived(accommodation.instantBooking);
</script>

<div class="mx-auto max-w-lg py-10 text-center sm:py-16">
	<div
		class="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
	>
		<CircleCheckIcon class="size-8" aria-hidden="true" />
	</div>

	<h1 class="mt-5 text-2xl font-semibold tracking-tight">
		{confirmed ? 'Your stay is booked!' : 'Request sent!'}
	</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		{confirmed
			? `You're all set for ${accommodation.title}. We've emailed your confirmation details.`
			: `${accommodation.host.name} will review your request and confirm shortly. We'll let you know either way.`}
	</p>

	<div class="mt-6 space-y-4 rounded-2xl border p-5 text-left sm:p-6">
		<div class="flex items-center justify-between gap-3">
			<span class="text-sm text-muted-foreground">Confirmation code</span>
			<span class="font-mono text-sm font-semibold tracking-wider">{bookingCode}</span>
		</div>
		<Separator />
		<dl class="space-y-2 text-sm">
			<div class="flex items-center justify-between gap-3">
				<dt class="text-muted-foreground">Stay</dt>
				<dd class="text-right font-medium">{accommodation.title}</dd>
			</div>
			<div class="flex items-center justify-between gap-3">
				<dt class="text-muted-foreground">Dates</dt>
				<dd class="text-right font-medium">
					{checkIn && checkOut ? formatDateRange(checkIn, checkOut) : '—'}
				</dd>
			</div>
			<div class="flex items-center justify-between gap-3">
				<dt class="text-muted-foreground">Guests</dt>
				<dd class="text-right font-medium">{formatGuestsShort(adults, children)}</dd>
			</div>
			<div class="flex items-center justify-between gap-3">
				<dt class="text-muted-foreground">Total ({paymentMethodLabel(paymentMethod)})</dt>
				<dd class="text-right font-semibold tabular-nums">{formatCurrency(quote.total)}</dd>
			</div>
		</dl>
	</div>

	<p class="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
		<MailIcon class="size-4" aria-hidden="true" />
		A copy was sent to {guestEmail}
	</p>

	<div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
		<Button href={localizeHref(listingHref)} variant="outline">Back to listing</Button>
		<Button href={localizeHref('/search')}>Browse more stays</Button>
	</div>
</div>
