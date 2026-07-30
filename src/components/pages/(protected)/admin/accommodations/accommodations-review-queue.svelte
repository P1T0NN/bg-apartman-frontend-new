<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { formatCurrency } from '@/utils/formatters';
	import { appHref } from '@/utils/app-navigation';

	// TYPES
	import type { PaginatedListPayload } from '@/components/ui/data-table/types';
	import type { AdminAccommodationRow } from '@/convex/tables/accommodations/queries/listAccommodationsAdmin';

	// LUCIDE ICONS
	import ImageIcon from '@lucide/svelte/icons/image';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import InboxIcon from '@lucide/svelte/icons/inbox';

	/**
	 * The review queue — the one mandatory workflow in the admin area
	 * (AdminPagesSystemDesign.md §2). Listings are born `pending_review` and only an admin
	 * can publish them, so if this zone doesn't exist listings go live via the Convex
	 * dashboard.
	 *
	 * Oldest first: they have waited longest. The zone disappears entirely when empty —
	 * the dashboard's Band-1 convention, where absence means "nothing to do".
	 *
	 * "Open" points at the PUBLIC accommodation page in a new tab: admins review the listing
	 * exactly as guests will see it, which is why no separate admin preview surface exists
	 * to build and keep in sync.
	 */
	let {
		onPublish,
		onSuspend
	}: {
		onPublish: (row: AdminAccommodationRow) => void;
		onSuspend: (row: AdminAccommodationRow) => void;
	} = $props();

	// Subscription, justified (GeneralSystemDesignRule.md): hosts submit listings while the
	// admin works — this queue is the admin-orders example verbatim. Its own small query
	// rather than filtering the table's page, so the queue is never truncated by pagination.
	const queue = useQuery(
		api.tables.accommodations.queries.listAccommodationsAdmin.listAccommodationsAdmin,
		() => ({
			status: 'pending_review' as const,
			page: 1,
			paginationOpts: { numItems: 20, cursor: null },
			sortColumn: 'createdAt' as const,
			sortDirection: 'asc' as const
		})
	);

	const payload = $derived(queue.data as PaginatedListPayload<AdminAccommodationRow> | undefined);
	const rows = $derived(payload?.page ?? []);
	const total = $derived(payload?.totalCount ?? 0);

	function submittedAgo(creationTime: number): string {
		const days = Math.floor((Date.now() - creationTime) / 86_400_000);
		if (days >= 1) return `${days}d waiting`;
		const hours = Math.floor((Date.now() - creationTime) / 3_600_000);
		return hours >= 1 ? `${hours}h waiting` : 'just now';
	}
</script>

{#if rows.length > 0}
	<Card class="gap-0 border-primary/30 bg-primary/3 p-4 sm:p-5">
		<div class="mb-4 flex items-start gap-3">
			<span
				class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
			>
				<InboxIcon class="size-5" aria-hidden="true" />
			</span>
			<div class="min-w-0 flex-1">
				<h2 class="text-base font-semibold tracking-tight">
					Waiting for review{total > rows.length ? ` (${total})` : ''}
				</h2>
				<p class="text-xs text-muted-foreground">
					Oldest first. Open each listing to review it as a guest would see it.
				</p>
			</div>
		</div>

		<ul class="flex flex-col divide-y">
			{#each rows as row (row._id)}
				<li class="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
					<div class="flex min-w-0 flex-1 items-center gap-3">
						{#if row.imageUrl}
							<img
								src={row.imageUrl}
								alt=""
								class="size-14 shrink-0 rounded-lg object-cover ring-1 ring-border"
								loading="lazy"
							/>
						{:else}
							<div
								class="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
							>
								<ImageIcon class="size-5" aria-hidden="true" />
							</div>
						{/if}

						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{row.title}</p>
							<p class="truncate text-xs text-muted-foreground">
								{row.hostName} · {row.city} · {formatCurrency(row.pricePerNight)}/night
							</p>
							<p class="text-xs text-muted-foreground tabular-nums">
								{submittedAgo(row._creationTime)}
							</p>
						</div>
					</div>

					<div class="flex shrink-0 items-center gap-2">
						<Button
							href={appHref(UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION.replace(':slug', row.slug))}
							target="_blank"
							rel="noopener"
							variant="outline"
							size="sm"
						>
							Open
							<ExternalLinkIcon class="size-3.5" aria-hidden="true" />
						</Button>
						<Button variant="ghost" size="sm" onclick={() => onSuspend(row)}>Suspend</Button>
						<Button size="sm" onclick={() => onPublish(row)}>Publish</Button>
					</div>
				</li>
			{/each}
		</ul>
	</Card>
{/if}
