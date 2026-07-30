<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import ConvexDataTable from '@/components/ui/data-table/convex-data-table.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import { FeatureStatus } from '@/components/ui/feature-status/index.js';
	import AccommodationsReviewQueue from '@/components/pages/(protected)/admin/accommodations/accommodations-review-queue.svelte';
	import AccommodationsFilters from '@/components/pages/(protected)/admin/accommodations/accommodations-filters.svelte';
	import ModerateAccommodationDialog from '@/components/pages/(protected)/admin/accommodations/moderate-accommodation-dialog.svelte';
	import StampListingFeeDialog from '@/components/pages/(protected)/admin/accommodations/stamp-listing-fee-dialog.svelte';

	// DATA
	import { ACCOMMODATION_STATUS_CONFIG } from '@/features/accommodations/data/accommodationsData';

	// UTILS
	import { formatCurrency } from '@/utils/formatters';
	import { appHref } from '@/utils/app-navigation';
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';
	import { listingFeeModeActive } from '@/shared/features/accommodation/utils/listingFeeState';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { ColumnDef, DataTableCellSnippetProps } from '@/components/ui/data-table/types.js';
	import type { AdminAccommodationRow } from '@/convex/tables/accommodations/queries/listAccommodationsAdmin';
	import type {
		typesAccommodationStatus,
		typesAccommodationType
	} from '@/shared/features/accommodation/types/accommodationTypes';

	// LUCIDE ICONS
	import ImageIcon from '@lucide/svelte/icons/image';
	import StarIcon from '@lucide/svelte/icons/star';
	import ReceiptIcon from '@lucide/svelte/icons/receipt';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	const convex = useConvexClient();

	/** Evaluated once — the monetization mode is a deploy-time constant. */
	const LISTING_FEE_MODE = listingFeeModeActive();

	// `hostId` arrives as a URL param from the user-detail page's "View listings" cross-link
	// (APSD §5) — filter state lives in the URL so a filtered view is a shareable link.
	const hostId = $derived(page.url.searchParams.get('hostId') ?? undefined);

	let status = $state<typesAccommodationStatus | undefined>(undefined);
	let type = $state<typesAccommodationType | undefined>(undefined);
	let sortColumn = $state<string | undefined>(undefined);
	let sortDirection = $state<'asc' | 'desc' | undefined>(undefined);
	let search = $state<string>('');

	const queryArgs = $derived({
		...(status !== undefined && { status }),
		...(type !== undefined && { type }),
		...(hostId !== undefined && { hostId })
	});

	// Dialog state — one row at a time, single-item confirm flows only (APSD §6).
	let moderationTarget = $state<AdminAccommodationRow | null>(null);
	let moderationAction = $state<'published' | 'suspended' | 'archived'>('published');
	let moderationOpen = $state(false);

	let feeTarget = $state<AdminAccommodationRow | null>(null);
	let feeOpen = $state(false);

	function openModeration(
		row: AdminAccommodationRow,
		action: 'published' | 'suspended' | 'archived'
	) {
		moderationTarget = row;
		moderationAction = action;
		moderationOpen = true;
	}

	function openFeeStamp(row: AdminAccommodationRow) {
		feeTarget = row;
		feeOpen = true;
	}

	/**
	 * Featuring is editorial, not moderation: it never changes status and is invisible to
	 * guests unless the listing is already `published` (search reads only `published`).
	 * Reversible in one click, so it skips the confirm dialog other actions get.
	 */
	let featuringId = $state<string | null>(null);
	async function toggleFeatured(row: AdminAccommodationRow, next: boolean) {
		featuringId = row._id;
		try {
			const result = await safeMutation(
				convex,
				api.tables.accommodations.mutations.setApartmentFeatured.setApartmentFeatured,
				{ id: row._id as Id<'apartments'>, isFeatured: next }
			);
			toastResult(result);
		} finally {
			featuringId = null;
		}
	}

	const columns: ColumnDef<AdminAccommodationRow>[] = [
		{ id: 'title', header: 'Listing', accessor: (r) => r.title, cellClass: 'min-w-64' },
		{ id: 'host', header: 'Host', accessor: (r) => r.hostName, hideBelow: 'md' },
		{ id: 'city', header: 'City', accessor: (r) => r.city, hideBelow: 'lg' },
		{ id: 'type', header: 'Type', accessor: (r) => r.type, hideBelow: 'lg' },
		{
			id: 'price',
			header: 'Price',
			accessor: (r) => r.pricePerNight,
			sortable: true,
			hideBelow: 'md'
		},
		{
			id: 'status',
			header: 'Status',
			accessor: (r) => ACCOMMODATION_STATUS_CONFIG[r.status].label,
			wrap: true
		},
		{
			id: 'createdAt',
			header: 'Created',
			accessor: (r) => new Date(r._creationTime).toLocaleDateString(),
			sortable: true,
			hideBelow: 'lg'
		},
		{ id: 'actions', header: '', accessor: () => null, cellClass: 'w-0', wrap: true }
	];
</script>

<SvelteHead />

<section class="flex w-full flex-col gap-4 p-4 md:p-6">
	<header class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight">Accommodations</h1>
		<p class="text-sm text-muted-foreground">
			Which listings need review, and what is live on the platform.
		</p>
	</header>

	<!-- The queue is the job, so it sits above the table and never hides behind a tab. -->
	<AccommodationsReviewQueue
		onPublish={(row) => openModeration(row, 'published')}
		onSuspend={(row) => openModeration(row, 'suspended')}
	/>

	<!-- Offset query (slices by `page`, returns an exact `totalCount`) — the cursor default
	     would re-serve the first slice on every page and never end. -->
	<ConvexDataTable
		caption="All listings"
		query={api.tables.accommodations.queries.listAccommodationsAdmin.listAccommodationsAdmin}
		optimizationStrategy="offset"
		controlsPlace="top"
		{queryArgs}
		{columns}
		getRowId={(r) => r._id}
		customCells={{ title: titleCell, price: priceCell, status: statusCell, actions: actionsCell }}
		bind:sortColumn
		bind:sortDirection
		searchable
		bind:search
		searchPlaceholder="Search by title…"
		{filters}
	/>
</section>

<ModerateAccommodationDialog
	accommodation={moderationTarget}
	action={moderationAction}
	bind:open={moderationOpen}
/>

{#if LISTING_FEE_MODE}
	<StampListingFeeDialog accommodation={feeTarget} bind:open={feeOpen} />
{/if}

{#snippet filters()}
	<AccommodationsFilters bind:status bind:type />
{/snippet}

{#snippet titleCell({ row }: DataTableCellSnippetProps<AdminAccommodationRow>)}
	<div class="flex min-w-0 items-center gap-3">
		<div class="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
			{#if row.imageUrl}
				<img src={row.imageUrl} alt="" class="size-full object-cover" loading="lazy" />
			{:else}
				<div class="flex size-full items-center justify-center text-muted-foreground">
					<ImageIcon class="size-4" aria-hidden="true" />
				</div>
			{/if}
		</div>

		<div class="min-w-0">
			<p class="flex items-center gap-1.5 truncate text-sm font-medium">
				{row.title}
				{#if row.isFeatured}
					<StarIcon
						class="size-3.5 shrink-0 fill-amber-500 text-amber-500"
						aria-label="Featured on the homepage"
					/>
				{/if}
			</p>
			<p class="truncate text-xs text-muted-foreground">{row.city}</p>
		</div>
	</div>
{/snippet}

{#snippet priceCell({ row }: DataTableCellSnippetProps<AdminAccommodationRow>)}
	<span class="tabular-nums">{formatCurrency(row.pricePerNight)}</span>
{/snippet}

{#snippet statusCell({ row }: DataTableCellSnippetProps<AdminAccommodationRow>)}
	<FeatureStatus config={ACCOMMODATION_STATUS_CONFIG} status={row.status} />
{/snippet}

{#snippet actionsCell({ row }: DataTableCellSnippetProps<AdminAccommodationRow>)}
	<div class="flex items-center justify-end gap-1">
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
			disabled={featuringId === row._id}
			onclick={() => toggleFeatured(row, !row.isFeatured)}
			aria-label={row.isFeatured ? 'Remove from homepage' : 'Feature on homepage'}
			title={row.isFeatured ? 'Remove from homepage' : 'Feature on homepage'}
		>
			<StarIcon
				class="size-4 {row.isFeatured ? 'fill-amber-500 text-amber-500' : ''}"
				aria-hidden="true"
			/>
		</Button>

		{#if LISTING_FEE_MODE}
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={() => openFeeStamp(row)}
				aria-label="Record fee payment"
				title="Record fee payment"
			>
				<ReceiptIcon class="size-4" aria-hidden="true" />
			</Button>
		{/if}

		<!-- Publish only from the two statuses §1's transition set allows. An `expired`
		     listing is NOT publishable here: billing is not moderation, and its road back is
		     a payment — the host renews, or an admin records a bank transfer with the
		     receipt button above (AccommodationsSystemDesign.md §1/§8). -->
		{#if row.status === 'pending_review' || row.status === 'suspended'}
			<Button size="sm" variant="outline" onclick={() => openModeration(row, 'published')}>
				Publish
			</Button>
		{/if}
		{#if row.status === 'published' || row.status === 'pending_review'}
			<Button size="sm" variant="ghost" onclick={() => openModeration(row, 'suspended')}>
				Suspend
			</Button>
		{/if}
		{#if row.status !== 'archived'}
			<Button size="sm" variant="ghost" onclick={() => openModeration(row, 'archived')}>
				Archive
			</Button>
		{/if}
	</div>
{/snippet}
