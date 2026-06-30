<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import BookingsStatus from '@/features/bookings/components/bookings-status.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// DATA
	import { BOOKING_STATUS_CONFIG } from '@/features/bookings/data/bookingsData';

	// TYPES
	import type { Component } from 'svelte';
	import type { typesBookingStatus } from '@/shared/features/booking/types/bookingTypes';

	// LUCIDE ICONS
	import RouteIcon from '@lucide/svelte/icons/route';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';

	type Step = { status: typesBookingStatus; icon: Component; description: string };

	// The happy-path lifecycle, in order. `cancelled` is an exception (it can interrupt the
	// flow at any point), so it's shown separately below rather than as a final step.
	const lifecycle: Step[] = [
		{
			status: 'pending',
			icon: ClockIcon,
			description: m['BookingStatusExplanation.pendingDescription']()
		},
		{
			status: 'confirmed',
			icon: CircleCheckIcon,
			description: m['BookingStatusExplanation.confirmedDescription']()
		},
		{
			status: 'checked_in',
			icon: LogInIcon,
			description: m['BookingStatusExplanation.checkedInDescription']()
		},
		{
			status: 'checked_out',
			icon: LogOutIcon,
			description: m['BookingStatusExplanation.checkedOutDescription']()
		}
	];

	const cancelledTone = BOOKING_STATUS_CONFIG.cancelled;
</script>

<SvelteHead
	title={m['BookingStatusExplanation.seoTitle']()}
	description={m['BookingStatusExplanation.seoDescription']()}
/>

<div class="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
	<header class="text-center">
		<div
			class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
		>
			<RouteIcon class="size-7" aria-hidden="true" />
		</div>
		<h1 class="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
			{m['BookingStatusExplanation.title']()}
		</h1>
		<p class="mx-auto mt-3 max-w-prose text-sm text-muted-foreground sm:text-base">
			{m['BookingStatusExplanation.subtitle']()}
		</p>
	</header>

	<!-- Lifecycle as a vertical timeline: the colour-coded node + the same badge guests see
	     elsewhere, with one plain-language line each. -->
	<ol class="mt-10">
		{#each lifecycle as step, i (step.status)}
			{@const tone = BOOKING_STATUS_CONFIG[step.status]}
			{@const Icon = step.icon}
			<li class="relative flex gap-4 pb-8 last:pb-0">
				{#if i < lifecycle.length - 1}
					<span
						class="absolute top-12 bottom-0 left-6 w-px -translate-x-1/2 bg-border"
						aria-hidden="true"
					></span>
				{/if}

				<div
					class={cn(
						'relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full ring-1',
						tone.badgeClass
					)}
				>
					<Icon class="size-5" aria-hidden="true" />
				</div>

				<div class="flex-1 space-y-2 pt-1.5">
					<BookingsStatus kind="booking" status={step.status} showHelp={false} />
					<p class="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
				</div>
			</li>
		{/each}
	</ol>

	<!-- Exception: cancelled. Set apart so it doesn't read as the natural last step. -->
	<section class="mt-8">
		<h2 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
			{m['BookingStatusExplanation.exceptionHeading']()}
		</h2>

		<div
			class="mt-3 flex items-start gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-5"
		>
			<div
				class={cn(
					'flex size-12 shrink-0 items-center justify-center rounded-full ring-1',
					cancelledTone.badgeClass
				)}
			>
				<CircleXIcon class="size-5" aria-hidden="true" />
			</div>

			<div class="flex-1 space-y-2 pt-1.5">
				<BookingsStatus kind="booking" status="cancelled" showHelp={false} />
				<p class="text-sm leading-relaxed text-muted-foreground">
					{m['BookingStatusExplanation.cancelledDescription']()}
				</p>
				<p class="text-xs text-muted-foreground/80">
					{m['BookingStatusExplanation.cancelledNote']()}
				</p>
			</div>
		</div>
	</section>
</div>
