<script lang="ts">
	// PARAGLIDE
	import { m } from '@/paraglide/messages';

	// COMPONENTS
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs/index.js';
	import UserOverview from '@/components/pages/(protected)/admin/users/[id]/user-overview.svelte';
	import UserSessions from '@/components/pages/(protected)/admin/users/[id]/user-sessions.svelte';
	import UserAccounts from '@/components/pages/(protected)/admin/users/[id]/user-accounts.svelte';
	import UserActivity from '@/components/pages/(protected)/admin/users/[id]/user-activity.svelte';
	import UserDangerZone from '@/components/pages/(protected)/admin/users/[id]/user-danger-zone/user-danger-zone.svelte';

	// TYPES
	import type { Doc } from '@/convex/auth/component/_generated/dataModel';

	type Props = {
		user: Doc<'user'>;
	};

	let { user }: Props = $props();

	let activeTab = $state('overview');
</script>

<Tabs bind:value={activeTab}>
	<TabsList>
		<TabsTrigger value="overview">{m['AdminUsersPage.UserTabs.overview']()}</TabsTrigger>
		<TabsTrigger value="sessions">{m['AdminUsersPage.UserTabs.sessions']()}</TabsTrigger>
		<TabsTrigger value="accounts">{m['AdminUsersPage.UserTabs.accounts']()}</TabsTrigger>
		<TabsTrigger value="activity">{m['AdminUsersPage.UserTabs.activity']()}</TabsTrigger>
		<TabsTrigger value="danger">{m['AdminUsersPage.UserTabs.dangerZone']()}</TabsTrigger>
	</TabsList>

	<TabsContent value="overview" class="pt-2">
		<UserOverview {user} />
	</TabsContent>

	<TabsContent value="sessions" class="pt-2">
		<UserSessions userId={user._id} />
	</TabsContent>

	<TabsContent value="accounts" class="pt-2">
		<UserAccounts userId={user._id} />
	</TabsContent>

	<TabsContent value="activity" class="pt-2">
		<UserActivity userId={user._id} />
	</TabsContent>

	<TabsContent value="danger" class="pt-2">
		<UserDangerZone {user} />
	</TabsContent>
</Tabs>
