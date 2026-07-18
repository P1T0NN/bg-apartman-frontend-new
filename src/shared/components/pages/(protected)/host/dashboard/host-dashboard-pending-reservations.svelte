<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints';

	// COMPONENTS
	import { Card } from '@/shared/components/ui/card/index.js';
	import { Button } from '@/shared/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { formatCurrency, formatDateRange, formatGuestsShort } from '@/utils/formatters';
	import { getPendingExpiryChip } from '@/shared/features/booking/utils/getPendingExpiryChip';

	// TYPES
	import type { typesPendingExpiryChip } from '@/shared/features/booking/types/bookingTypes';
	import type { HostPendingReservations } from '@/convex/pages/host/dashboard/types/hostDashboardTypes';

	// LUCIDE ICONS
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

	let { data }: { data: HostPendingReservations | undefined } = $props();

	// Pending reservations are read-only here — confirming/declining happens on the reservations
	// page. This card just surfaces what's waiting and links across.
	const pendingHref = localizeHref(`${PROTECTED_PAGE_ENDPOINTS.RESERVATIONS}?status=pending`);

	function expiryLabel(chip: typesPendingExpiryChip) {
		if (chip.isExpired) return m['HostDashboardPage.PendingReservations.expired']();
		if (chip.timeRemaining) {
			return m['HostDashboardPage.PendingReservations.expiresIn']({ time: chip.timeRemaining });
		}
		return null;
	}

	const toneClass: Record<'red' | 'amber' | 'neutral', string> = {
		red: 'bg-destructive/10 text-destructive',
		amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
		neutral: 'bg-muted text-muted-foreground'
	};
</script>

{#if data && data.items.length > 0}
	<Card class="gap-0 border-primary/30 bg-primary/3 p-4 sm:p-5">
		<div class="mb-4 flex items-start gap-3">
			<span
				class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
			>
				<InboxIcon class="size-5" aria-hidden="true" />
			</span>
			<div class="min-w-0 flex-1">
				<h2 class="text-base font-semibold tracking-tight">
					{m['HostDashboardPage.PendingReservations.heading']()}
				</h2>
				<p class="text-xs text-muted-foreground">
					{m['HostDashboardPage.PendingReservations.subheading']()}
				</p>
			</div>
		</div>

		<ul class="flex flex-col divide-y">
			{#each data.items as booking (booking._id)}
				{@const chip = getPendingExpiryChip(booking.pendingExpiresAt)}
				{@const label = chip ? expiryLabel(chip) : null}
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
							{#if chip && label}
								<span
									class={cn(
										'shrink-0 rounded-full px-1.5 py-0.5 text-[0.65rem] font-medium tabular-nums',
										toneClass[chip.tone]
									)}
								>
									{label}
								</span>
							{/if}
						</div>
						<p class="truncate text-xs text-muted-foreground">{booking.apartment.title}</p>
						<p class="truncate text-xs text-muted-foreground">
							{formatDateRange(booking.checkInDate, booking.checkOutDate)}
							· {formatGuestsShort(booking.numberOfAdults, booking.numberOfChildren)}
							· {formatCurrency(booking.total)}
						</p>
					</div>
				</li>
			{/each}
		</ul>

		<Button href={pendingHref} variant="outline" size="sm" class="mt-4 self-start">
			{m['HostDashboardPage.PendingReservations.view']()}
			<ArrowRightIcon class="size-4" aria-hidden="true" />
		</Button>
	</Card>
{/if}
