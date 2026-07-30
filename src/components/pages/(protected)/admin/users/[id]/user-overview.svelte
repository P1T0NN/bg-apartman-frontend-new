<script lang="ts">
	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/routeEndpoints.js';

	// COMPONENTS
	import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import CopyButton from '@/components/ui/copy-button/copy-button.svelte';

	// UTILS
	import { capitalizeFirst } from '@/shared/utils/stringUtils';
	import { appHref } from '@/utils/app-navigation';

	// TYPES
	import type { Doc } from '@/convex/auth/component/_generated/dataModel';

	// LUCIDE ICONS
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import Building2Icon from '@lucide/svelte/icons/building-2';

	let { user }: { user: Doc<'user'> } = $props();

	/**
	 * Cross-links to this person's platform activity (AdminPagesSystemDesign.md §5) — how a
	 * non-developer admin answers "what has this person done here?" without learning the
	 * data model.
	 *
	 * Filter state travels in the URL, so both pages open pre-filtered and the view is a
	 * shareable link between two admins rather than a set of instructions (§7).
	 */
	const bookingsHref = $derived(
		`${ADMIN_PAGE_ENDPOINTS.BOOKINGS}?guestId=${encodeURIComponent(user._id)}`
	);
	const listingsHref = $derived(
		`${ADMIN_PAGE_ENDPOINTS.ACCOMMODATIONS}?hostId=${encodeURIComponent(user._id)}`
	);

	const displayName = $derived(capitalizeFirst(user.name || user.email));
	const createdAt = $derived(new Date(user._creationTime).toLocaleString());
	const updatedAt = $derived(new Date(user.updatedAt).toLocaleString());
	const banExpiresAt = $derived(
		user.banExpires ? new Date(user.banExpires).toLocaleString() : null
	);
</script>

{#snippet field(label: string, value: string)}
	<div class="flex flex-col gap-0.5">
		<span class="text-xs tracking-wide text-muted-foreground uppercase">{label}</span>
		<span class="text-sm">{value}</span>
	</div>
{/snippet}

<div class="flex flex-col gap-6">
	<div class="flex items-center gap-4">
		<Avatar class="size-16">
			{#if user.image}
				<AvatarImage src={user.image} alt={displayName} />
			{/if}
			<AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
		</Avatar>

		<div class="flex flex-col gap-1">
			<h2 class="text-lg font-semibold">{displayName}</h2>
			<div class="flex items-center gap-2 text-sm">
				<span class="text-muted-foreground">{user.email}</span>
				{#if user.emailVerified}
					<span
						class="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200"
					>
						Verified
					</span>
				{:else}
					<span
						class="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
					>
						Unverified
					</span>
				{/if}
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		{@render field('Role', capitalizeFirst(user.role))}
		{@render field(
			'Status',
			user.banned
				? banExpiresAt
					? `Banned until ${banExpiresAt}`
					: 'Banned (permanent)'
				: 'Active'
		)}
		{#if user.banned && user.banReason}
			{@render field('Ban reason', user.banReason)}
		{/if}
		{@render field('Created', createdAt)}
		{@render field('Updated', updatedAt)}
	</div>

	<div class="flex flex-col gap-2">
		<span class="text-xs tracking-wide text-muted-foreground uppercase">Activity</span>
		<div class="flex flex-wrap items-center gap-2">
			<Button href={appHref(bookingsHref)} variant="outline" size="sm">
				<CalendarDaysIcon class="size-4" aria-hidden="true" />
				View bookings
			</Button>
			<Button href={appHref(listingsHref)} variant="outline" size="sm">
				<Building2Icon class="size-4" aria-hidden="true" />
				View listings
			</Button>
		</div>
	</div>

	<div class="flex flex-col gap-2">
		<span class="text-xs tracking-wide text-muted-foreground uppercase">User ID</span>
		<div class="flex items-center gap-2">
			<code class="rounded bg-muted px-2 py-1 font-mono text-xs">{user._id}</code>
			<CopyButton value={user._id} label="Copy user ID" />
		</div>
	</div>
</div>
