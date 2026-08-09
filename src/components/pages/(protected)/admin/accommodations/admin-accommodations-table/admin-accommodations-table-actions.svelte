<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import AdminModerateAccommodationDialog from '../admin-moderate-accommodation-dialog.svelte';
	import AdminStampListingFeeDialog from '../admin-stamp-listing-fee-dialog.svelte';

	// UTILS
	import { appHref } from '@/utils/app-navigation';
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';
	import { listingIsListingFee } from '@/shared/features/accommodation/utils/listingFeeState';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { AdminAccommodationRow } from '@/shared/features/accommodation/types/accommodationTypes';

	// LUCIDE ICONS
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import StarIcon from '@lucide/svelte/icons/star';
	import ReceiptIcon from '@lucide/svelte/icons/receipt';

	/**
	 * Every moderation action available on one listing row (AdminPagesSystemDesign.md §2).
	 * The row is the only prop: this component owns its own mutation calls and its own
	 * dialogs, so the page above it stays a header plus a table.
	 *
	 * Dialogs are per row, single-item confirm flows only (§6) — the same shape the host's
	 * change-plan action uses. They mount their content only while open.
	 */
	let { row }: { row: AdminAccommodationRow } = $props();

	const convex = useConvexClient();

	let moderationAction = $state<'published' | 'suspended' | 'archived'>('published');
	let moderationOpen = $state(false);
	let feeOpen = $state(false);

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

<div class="flex items-center justify-end gap-1">
	<!-- The public page in a new tab: admins review a listing exactly as guests see it,
	     which is why no separate admin preview surface exists to keep in sync. -->
	<Button
		href={appHref(UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION.replace(':slug', row.slug))}
		target="_blank"
		rel="noopener"
		variant="ghost"
		size="icon-sm"
		aria-label="Open public page"
		title="Open public page"
	>
		<ExternalLinkIcon class="size-4" aria-hidden="true" />
	</Button>

	<Button
		variant="ghost"
		size="icon-sm"
		disabled={featuring}
		onclick={toggleFeatured}
		aria-label={row.isFeatured ? 'Remove from homepage' : 'Feature on homepage'}
		title={row.isFeatured ? 'Remove from homepage' : 'Feature on homepage'}
	>
		<StarIcon
			class="size-4 {row.isFeatured ? 'fill-amber-500 text-amber-500' : ''}"
			aria-hidden="true"
		/>
	</Button>

	{#if listingIsListingFee(row)}
		<Button
			variant="ghost"
			size="icon-sm"
			onclick={() => (feeOpen = true)}
			aria-label="Record fee payment"
			title="Record fee payment"
		>
			<ReceiptIcon class="size-4" aria-hidden="true" />
		</Button>
	{/if}

	<!-- Publish only from the two statuses §1's transition set allows. An `expired` listing
	     is NOT publishable here: billing is not moderation, and its road back is a payment —
	     the host renews, or an admin records a bank transfer with the receipt button above
	     (AccommodationsSystemDesign.md §1/§8). -->
	{#if row.status === 'pending_review' || row.status === 'suspended'}
		<Button size="sm" variant="outline" onclick={() => openModeration('published')}>Publish</Button>
	{/if}
	{#if row.status === 'published' || row.status === 'pending_review'}
		<Button size="sm" variant="ghost" onclick={() => openModeration('suspended')}>Suspend</Button>
	{/if}
	{#if row.status !== 'archived'}
		<Button size="sm" variant="ghost" onclick={() => openModeration('archived')}>Archive</Button>
	{/if}
</div>

<AdminModerateAccommodationDialog
	accommodation={row}
	action={moderationAction}
	bind:open={moderationOpen}
/>

{#if listingIsListingFee(row)}
	<AdminStampListingFeeDialog accommodation={row} bind:open={feeOpen} />
{/if}
