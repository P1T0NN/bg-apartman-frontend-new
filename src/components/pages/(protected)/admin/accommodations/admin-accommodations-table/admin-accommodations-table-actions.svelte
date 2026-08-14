<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator
	} from '@/components/ui/dropdown-menu';
	import AdminModerateAccommodationDialog from '../admin-moderate-accommodation-dialog.svelte';
	import AdminStampListingFeeDialog from '../admin-stamp-listing-fee-dialog.svelte';
	import AdminGrantFreePublishDialog from '../admin-grant-free-publish-dialog.svelte';

	// UTILS
	import { appHref } from '@/utils/app-navigation';
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';
	import {
		listingFeeState,
		listingIsListingFee
	} from '@/shared/features/accommodation/utils/listingFeeState';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { AdminAccommodationRow } from '@/shared/features/accommodation/types/accommodationTypes';

	// LUCIDE ICONS
	import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import StarIcon from '@lucide/svelte/icons/star';
	import GiftIcon from '@lucide/svelte/icons/gift';
	import ReceiptIcon from '@lucide/svelte/icons/receipt';
	import CheckIcon from '@lucide/svelte/icons/check';
	import BanIcon from '@lucide/svelte/icons/ban';
	import ArchiveIcon from '@lucide/svelte/icons/archive';

	/**
	 * Every moderation action available on one listing row (AdminPagesSystemDesign.md §2),
	 * behind a single ellipsis menu — the row stays a header plus a table, and one control
	 * per row beats a stack of icon buttons for the price of one extra click.
	 *
	 * Dialogs are per row, single-item confirm flows only (§6) — the same shape the host's
	 * change-plan action uses. They mount their content only while open.
	 */
	let { row }: { row: AdminAccommodationRow } = $props();

	const convex = useConvexClient();

	// Once a listing is covered forever, both billing actions are no-ops: a re-grant does
	// nothing, and recording a payment would stamp revenue nobody paid — so the menu hides
	// them. Finite grants keep both (extending or topping up is still meaningful).
	const fee = $derived(listingIsListingFee(row) ? listingFeeState(row) : null);
	const coveredForever = $derived(fee?.kind === 'active' && fee.daysLeft === null);

	let moderationAction = $state<'published' | 'suspended' | 'archived'>('published');
	let moderationOpen = $state(false);
	let feeOpen = $state(false);
	let freePublishOpen = $state(false);

	function openModeration(action: 'published' | 'suspended' | 'archived') {
		moderationAction = action;
		moderationOpen = true;
	}

	/**
	 * Featuring is editorial, not moderation: it never changes status and is invisible to
	 * guests unless the listing is already `published` (search reads only `published`).
	 * Reversible in one click, so it skips the confirm dialog the other actions get.
	 */
	let featuring = $state(false);
	async function toggleFeatured() {
		featuring = true;
		try {
			const result = await safeMutation(
				convex,
				api.tables.accommodations.mutations.setApartmentFeatured.setApartmentFeatured,
				{ id: row._id as Id<'apartments'>, isFeatured: !row.isFeatured }
			);
			toastResult(result);
		} finally {
			featuring = false;
		}
	}
</script>

<div class="flex items-center justify-end">
	<DropdownMenu>
		<DropdownMenuTrigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="ghost"
					size="icon-sm"
					aria-label={m['AdminAccommodationsPage.AdminAccommodationsTableActions.moreActions']()}
					title={m['AdminAccommodationsPage.AdminAccommodationsTableActions.moreActions']()}
				>
					<MoreHorizontalIcon class="size-4" aria-hidden="true" />
				</Button>
			{/snippet}
		</DropdownMenuTrigger>

		<DropdownMenuContent align="end" class="w-56">
			<!-- The public page in a new tab: admins review a listing exactly as guests see it,
		     which is why no separate admin preview surface exists to keep in sync. -->
			<DropdownMenuItem
				onclick={() =>
					window.open(
						appHref(UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION.replace(':slug', row.slug)),
						'_blank',
						'noopener'
					)}
			>
				<ExternalLinkIcon aria-hidden="true" />
				{m['AdminAccommodationsPage.AdminAccommodationsTableActions.openPublicPage']()}
			</DropdownMenuItem>

			<DropdownMenuItem onclick={toggleFeatured} disabled={featuring}>
				<StarIcon
					class={row.isFeatured ? 'fill-amber-500 text-amber-500' : ''}
					aria-hidden="true"
				/>
				{row.isFeatured
					? m['AdminAccommodationsPage.AdminAccommodationsTableActions.removeFromHomepage']()
					: m['AdminAccommodationsPage.AdminAccommodationsTableActions.featureOnHomepage']()}
			</DropdownMenuItem>

			{#if listingIsListingFee(row) && !coveredForever}
				<DropdownMenuSeparator />
				<!-- Billing is not moderation: the grant and the bank-transfer stamp sit in their own
			     group, above the status actions. Hidden once covered forever — see `coveredForever`. -->
				<DropdownMenuItem onclick={() => (freePublishOpen = true)}>
					<GiftIcon aria-hidden="true" />
					{m['AdminAccommodationsPage.AdminAccommodationsTableActions.grantFreePublish']()}
				</DropdownMenuItem>
				<DropdownMenuItem onclick={() => (feeOpen = true)}>
					<ReceiptIcon aria-hidden="true" />
					{m['AdminAccommodationsPage.AdminAccommodationsTableActions.recordFeePayment']()}
				</DropdownMenuItem>
			{/if}

			<DropdownMenuSeparator />

			<!-- Publish only from the two statuses §1's transition set allows. An `expired` listing
		     is NOT publishable here: its road back is a payment — the host renews, or an admin
		     records a bank transfer or grants free publish above (AccommodationsSystemDesign.md §1/§8). -->
			{#if row.status === 'pending_review' || row.status === 'suspended'}
				<DropdownMenuItem onclick={() => openModeration('published')}>
					<CheckIcon aria-hidden="true" />
					{m['AdminAccommodationsPage.AdminAccommodationsTableActions.publish']()}
				</DropdownMenuItem>
			{/if}
			{#if row.status === 'published' || row.status === 'pending_review'}
				<DropdownMenuItem onclick={() => openModeration('suspended')}>
					<BanIcon aria-hidden="true" />
					{m['AdminAccommodationsPage.AdminAccommodationsTableActions.suspend']()}
				</DropdownMenuItem>
			{/if}
			{#if row.status !== 'archived'}
				<DropdownMenuItem onclick={() => openModeration('archived')}>
					<ArchiveIcon aria-hidden="true" />
					{m['AdminAccommodationsPage.AdminAccommodationsTableActions.archive']()}
				</DropdownMenuItem>
			{/if}
		</DropdownMenuContent>
	</DropdownMenu>
</div>

<AdminModerateAccommodationDialog
	accommodation={row}
	action={moderationAction}
	bind:open={moderationOpen}
/>

{#if listingIsListingFee(row)}
	<AdminGrantFreePublishDialog accommodation={row} bind:open={freePublishOpen} />
	<AdminStampListingFeeDialog accommodation={row} bind:open={feeOpen} />
{/if}
