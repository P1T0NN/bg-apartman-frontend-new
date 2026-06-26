<script lang="ts">
	// SVELTEKIT
	import { goto } from '$app/navigation';

	// CLASSES
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// LIBRARIES
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { localizeHref } from '@/shared/lib/paraglide/runtime';
	import { m } from '@/shared/lib/paraglide/messages';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/constants.js';

	// COMPONENTS
	import * as Avatar from '@/shared/components/ui/avatar/index.js';
	import * as DropdownMenu from '@/shared/components/ui/dropdown-menu/index.js';
	import Button from '@/shared/components/ui/button/button.svelte';
	import { Spinner } from '@/shared/components/ui/spinner/index.js';
	import LogoutButton from '@/features/auth/components/logout-button/logout-button.svelte';

	// UTILS
	import { cn } from '@/shared/utils/utils.js';
	import { initials } from '@/shared/utils/stringUtils';

	// LUCIDE ICONS
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import HomeIcon from '@lucide/svelte/icons/home';

	let { class: className }: { class?: string } = $props();

	const auth = useAuth();
	const user = $derived(authClass.currentUser);
	const showUserLoading = $derived(
		auth.isLoading || authClass.userLoading || (auth.isAuthenticated && user === undefined)
	);

	function navigate(href: string) {
		void goto(localizeHref(href));
	}
</script>

<div class={cn('flex items-center gap-1.5 sm:gap-2', className)}>
	<Button
		variant="outline"
		size="sm"
		class="hidden sm:inline-flex"
		href={localizeHref(PROTECTED_PAGE_ENDPOINTS.GUEST_DASHBOARD)}
	>
		{m['Header.guestDashboard']()}
	</Button>

	<DropdownMenu.Root>
		<DropdownMenu.Trigger disabled={showUserLoading}>
			{#snippet child({ props })}
				<button
					{...props}
					type="button"
					class={cn(
						'inline-flex size-8 shrink-0 items-center justify-center rounded-full outline-none transition-colors',
						'hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50',
						props.class as string | undefined
					)}
					aria-label={m['Header.accountMenu']()}
				>
					{#if showUserLoading}
						<Spinner class="size-4" />
					{:else}
						<Avatar.Root class="size-8">
							<Avatar.Image src={user?.image} alt={user?.name ?? ''} />
							<Avatar.Fallback class="text-xs font-medium">{initials(user?.name)}</Avatar.Fallback>
						</Avatar.Root>
					{/if}
				</button>
			{/snippet}
		</DropdownMenu.Trigger>

		<DropdownMenu.Content align="end" class="min-w-52">
			<DropdownMenu.Label class="font-normal">
				<div class="flex flex-col gap-0.5 px-0.5 py-1">
					<span class="truncate text-sm font-medium">{user?.name ?? 'Account'}</span>
					{#if user?.email}
						<span class="text-muted-foreground truncate text-xs">{user.email}</span>
					{/if}
				</div>
			</DropdownMenu.Label>

			<DropdownMenu.Separator />

			<DropdownMenu.Item onclick={() => navigate(PROTECTED_PAGE_ENDPOINTS.GUEST_DASHBOARD)}>
				<LayoutDashboardIcon />
				{m['Header.guestDashboard']()}
			</DropdownMenu.Item>

			<DropdownMenu.Item onclick={() => navigate(PROTECTED_PAGE_ENDPOINTS.HOST_DASHBOARD)}>
				<HomeIcon />
				{m['Header.becomeAHost']()}
			</DropdownMenu.Item>

			<DropdownMenu.Separator />

			<LogoutButton menuItem />
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
