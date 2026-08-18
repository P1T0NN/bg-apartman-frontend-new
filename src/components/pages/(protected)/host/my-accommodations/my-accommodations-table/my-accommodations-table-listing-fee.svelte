<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';
	import { toast } from 'svelte-sonner';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// CONFIG
	import { ACCOMMODATIONS_CONFIG } from '@/shared/config';

	// UTILS
	import { formatDate } from '@/utils/formatters';
	import { cn } from '@/utils/utils.js';
	import { safeAction } from '@/utils/convexHelpers';
	import { translateFromBackend } from '@/features/validations/utils/translateFromBackend';
	import {
		listingFeeState,
		listingIsBookingFee
	} from '@/shared/features/accommodation/utils/listingFeeState';

	// TYPES
	import type { typesAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';

	// LUCIDE ICONS
	import { Loader } from '@lucide/svelte';

	let { row }: { row: typesAccommodation } = $props();

	const fee = $derived(listingFeeState(row));

	const convex = useConvexClient();
	let pending = $state(false);

	/** Starts the Stripe checkout; the webhook-stamped row re-render is the success signal,
	 *  not this redirect (StripeTODO §6a — the redirect alone proves nothing). */
	async function startCheckout() {
		pending = true;
		try {
			const result = await safeAction(
				convex,
				api.tables.accommodations.mutations.createListingFeeCheckout.createListingFeeCheckout,
				{
					id: row._id,
					// Back to the listings page the host was on — Stripe handles the rest.
					successUrl: window.location.origin + window.location.pathname,
					cancelUrl: window.location.origin + window.location.pathname,
					locale: getLocale()
				}
			);
			if (!result) return; // error already toasted
			if (!result.success) {
				toast.error(translateFromBackend(result.message));
				return;
			}
			window.location.href = result.redirectUrl;
		} finally {
			pending = false;
		}
	}
</script>

<div class="flex flex-col gap-1.5">
	{#if listingIsBookingFee(row)}
		<!-- No "Change plan" control here — the switch is one-way (ASD §8), and a control
		     that only says "you can't" is noise. The fact and the road are visible text. -->
		<span class="text-sm text-muted-foreground">
			{m['HostMyAccommodationsPage.MyAccommodationsTableListingFee.perBookingFee']({
				percent: ACCOMMODATIONS_CONFIG.BOOKING_FEE.PERCENT
			})}
		</span>
	{:else if fee.kind === 'inactive'}
		<!-- No model stamped: the flip backfill hasn't reached this row, and the sweep
		     leaves it alone until it does. Nothing to bill, nothing to say. -->
		<span class="text-sm text-muted-foreground">—</span>
	{:else if fee.kind === 'unpaid'}
		<!-- The first payment gates going live (ASD §8). The button carries the price —
		     the state text stays a statement, the button is the action. -->
		<span class="text-sm font-medium text-foreground">
			{m['HostMyAccommodationsPage.MyAccommodationsTableListingFee.listingFeeNotPaid']()}
		</span>
		<Button size="sm" disabled={pending} onclick={startCheckout}>
			{#if pending}
				<Loader class="size-3 animate-spin" />
			{/if}
			{m['HostMyAccommodationsPage.MyAccommodationsTableListingFee.payNow']({
				amount: ACCOMMODATIONS_CONFIG.LISTING_FEE.AMOUNT
			})}
		</Button>
	{:else}
		<span
			class={cn(
				'text-sm',
				fee.kind === 'active' ? 'text-muted-foreground' : 'font-medium text-foreground'
			)}
		>
			{#if fee.kind === 'lapsed'}
				{m['HostMyAccommodationsPage.MyAccommodationsTableListingFee.expired']()}
			{:else if fee.kind === 'grace'}
				{m['HostMyAccommodationsPage.MyAccommodationsTableListingFee.overdueRenewNow']()}
			{:else if fee.kind === 'expiring'}
				{fee.daysLeft === 0
					? m['HostMyAccommodationsPage.MyAccommodationsTableListingFee.expiresToday']()
					: m['HostMyAccommodationsPage.MyAccommodationsTableListingFee.expiresInDays']({
							days: fee.daysLeft
						})}
			{:else if fee.daysLeft === null}
				<!-- A "forever" grant: no countdown, and "Until 2100" would be noise. -->
				{m['HostMyAccommodationsPage.MyAccommodationsTableListingFee.coveredForever']()}
			{:else}
				{m['HostMyAccommodationsPage.MyAccommodationsTableListingFee.untilDate']({
					date: formatDate(fee.expiresAt)
				})}
			{/if}
		</span>

		<!-- An expired or overdue listing revives on payment, same as a grant (StripeTODO §6a). -->
		{#if fee.kind === 'lapsed' || fee.kind === 'grace'}
			<Button size="sm" disabled={pending} onclick={startCheckout}>
				{#if pending}
					<Loader class="size-3 animate-spin" />
				{/if}
				{m['HostMyAccommodationsPage.MyAccommodationsTableListingFee.renew']()}
			</Button>
		{/if}
	{/if}
</div>
