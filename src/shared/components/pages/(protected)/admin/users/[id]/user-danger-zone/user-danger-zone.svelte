<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/routeEndpoints.js';

	// COMPONENTS
	import UserDangerZoneItem from './user-danger-zone-item.svelte';
	import ChangeRoleButton from './change-role-button.svelte';
	import UnbanUserButton from './unban-user-button.svelte';
	import BanUserDialog from './ban-user-dialog.svelte';
	import DeleteUserDialog from './delete-user-dialog.svelte';

	// UTILS
	import { capitalizeFirst } from '@/shared/utils/stringUtils';

	// TYPES
	import type { Doc } from '@/convex/auth/component/_generated/dataModel';

	let { user }: { user: Doc<'user'> } = $props();
</script>

<div class="flex flex-col gap-4 rounded-lg border border-destructive/40 p-4">
	<header class="flex flex-col gap-1">
		<h2 class="text-base font-semibold text-destructive">
			{m['AdminUserPage.UserDangerZone.title']()}
		</h2>
		<p class="text-sm text-muted-foreground">
			{m['AdminUserPage.UserDangerZone.description']()}
		</p>
	</header>

	<UserDangerZoneItem
		title={m['AdminUserPage.UserDangerZone.role']({ role: capitalizeFirst(user.role) })}
		description={user.role === 'admin'
			? m['AdminUserPage.UserDangerZone.removeAdmin']()
			: m['AdminUserPage.UserDangerZone.grantAdmin']()}
	>
		<ChangeRoleButton userId={user._id} userEmail={user.email} role={user.role} />
	</UserDangerZoneItem>

	<UserDangerZoneItem
		title={user.banned
			? m['AdminUserPage.UserDangerZone.banned']()
			: m['AdminUserPage.UserDangerZone.active']()}
		description={user.banned
			? m['AdminUserPage.UserDangerZone.liftBan']()
			: m['AdminUserPage.UserDangerZone.signOutPrevent']()}
	>
		{#if user.banned}
			<UnbanUserButton userId={user._id} />
		{:else}
			<BanUserDialog userId={user._id} userEmail={user.email} />
		{/if}
	</UserDangerZoneItem>

	<DeleteUserDialog
		userId={user._id}
		userEmail={user.email}
		role={user.role}
		redirectUrl={ADMIN_PAGE_ENDPOINTS.USERS}
	/>
</div>
