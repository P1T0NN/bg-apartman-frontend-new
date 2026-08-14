<script lang="ts">
	// PARAGLIDE
	import { m } from '@/paraglide/messages';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/routeEndpoints.js';

	// COMPONENTS
	import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import CopyButton from '@/components/ui/copy-button/copy-button.svelte';
	import SuperhostButton from './superhost-button.svelte';

	// UTILS
	import { capitalizeFirst } from '@/shared/utils/stringUtils';
	import { appHref } from '@/utils/app-navigation';
	import { getLocale } from '@/paraglide/runtime';

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
	const createdAt = $derived(new Date(user._creationTime).toLocaleString(getLocale()));
	const updatedAt = $derived(new Date(user.updatedAt).toLocaleString(getLocale()));
	const banExpiresAt = $derived(
		user.banExpires ? new Date(user.banExpires).toLocaleString(getLocale()) : null
	);

	// Stored optional (and better-auth may write `null`), so undefined/null both mean "no".
	const isSuperhost = $derived(user.isSuperhost === true);
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
						{m['AdminUsersPage.UserOverview.verified']()}
					</span>
				{:else}
					<span
						class="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
					>
						{m['AdminUsersPage.UserOverview.unverified']()}
					</span>
				{/if}
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		{@render field(m['AdminUsersPage.UserOverview.roleLabel'](), capitalizeFirst(user.role))}
		{@render field(
			m['AdminUsersPage.UserOverview.statusLabel'](),
			user.banned
				? banExpiresAt
					? m['AdminUsersPage.UserOverview.bannedUntil']({ date: banExpiresAt })
					: m['AdminUsersPage.UserOverview.bannedPermanent']()
				: m['AdminUsersPage.UserOverview.statusActive']()
		)}
		{#if user.banned && user.banReason}
			{@render field(m['AdminUsersPage.UserOverview.banReasonLabel'](), user.banReason)}
		{/if}
		{@render field(m['AdminUsersPage.UserOverview.createdLabel'](), createdAt)}
		{@render field(m['AdminUsersPage.UserOverview.updatedLabel'](), updatedAt)}
	</div>

	<div class="flex flex-col gap-2">
		<span class="text-xs tracking-wide text-muted-foreground uppercase">{m['AdminUsersPage.UserOverview.reputationLabel']()}</span>
		<div class="flex flex-wrap items-center justify-between gap-3">
			<p class="text-sm text-muted-foreground">
				{isSuperhost
					? m['AdminUsersPage.UserOverview.superhostDescription']()
					: m['AdminUsersPage.UserOverview.notSuperhostDescription']()}
			</p>
			<SuperhostButton userId={user._id} userEmail={user.email} {isSuperhost} />
		</div>
	</div>

	<div class="flex flex-col gap-2">
		<span class="text-xs tracking-wide text-muted-foreground uppercase">{m['AdminUsersPage.UserOverview.activityLabel']()}</span>
		<div class="flex flex-wrap items-center gap-2">
			<Button href={appHref(bookingsHref)} variant="outline" size="sm">
				<CalendarDaysIcon class="size-4" aria-hidden="true" />
				{m['AdminUsersPage.UserOverview.viewBookings']()}
			</Button>
			<Button href={appHref(listingsHref)} variant="outline" size="sm">
				<Building2Icon class="size-4" aria-hidden="true" />
				{m['AdminUsersPage.UserOverview.viewListings']()}
			</Button>
		</div>
	</div>

	<div class="flex flex-col gap-2">
		<span class="text-xs tracking-wide text-muted-foreground uppercase">{m['AdminUsersPage.UserOverview.userIdLabel']()}</span>
		<div class="flex items-center gap-2">
			<code class="rounded bg-muted px-2 py-1 font-mono text-xs">{user._id}</code>
			<CopyButton value={user._id} label={m['AdminUsersPage.UserOverview.copyUserId']()} />
		</div>
	</div>
</div>
