<script lang="ts">
	// CLASSES
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// LIBRARIES
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';

	// I18N
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS, UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints.js';

	// COMPONENTS
	import * as Avatar from '@/components/ui/avatar/index.js';
	import * as DropdownMenu from '@/components/ui/dropdown-menu/index.js';
	import Button from '@/components/ui/button/button.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import LogoutButton from '@/features/auth/components/logout-button/logout-button.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { initials } from '@/shared/utils/stringUtils';
	import { appGoto, appHref } from '@/utils/app-navigation.js';

	// LUCIDE ICONS
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import StoreIcon from '@lucide/svelte/icons/store';
	import FlagIcon from '@lucide/svelte/icons/flag';

	let { class: className }: { class?: string } = $props();

	const auth = useAuth();
	const user = $derived(authClass.currentUser);
	// Non-hosts get a "Become a host" CTA; existing hosts get "Switch to hosting".
	const isHost = $derived(user?.isHost === true);
	const showUserLoading = $derived(
		auth.isLoading || authClass.userLoading || (auth.isAuthenticated && user === undefined)
	);

	function navigate(href: string) {
		void appGoto(href);
	}
</script>

<div class={cn('flex items-center gap-1.5 sm:gap-2', className)}>
	<!-- Mode switch — the reversible counterpart to the host shell's "Switch to traveling".
	     The guest dashboard lives in the avatar menu, so it isn't duplicated here. -->
	<Button
		size="sm"
		class="hidden rounded-full bg-primary text-primary-foreground hover:opacity-90 sm:inline-flex"
		href={appHref(PROTECTED_PAGE_ENDPOINTS.HOST_DASHBOARD)}
	>
		<StoreIcon />
		{isHost
			? m['Header.NormalHeaderAuthActions.switchToHosting']()
			: m['Header.NormalHeaderAuthActions.becomeAHost']()}
	</Button>

	<DropdownMenu.Root>
		<DropdownMenu.Trigger disabled={showUserLoading}>
			{#snippet child({ props })}
				<button
					{...props}
					type="button"
					class={cn(
						'inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors outline-none',
						'hover:bg-hero-overlay-foreground/10 focus-visible:ring-[3px] focus-visible:ring-hero-overlay-foreground/40',
						props.class as string | undefined
					)}
					aria-label={m['Header.NormalHeaderAuthActions.accountMenu']()}
				>
					{#if showUserLoading}
						<Spinner class="size-4" />
					{:else}
						<Avatar.Root class="size-8">
							<Avatar.Image src={user?.image} alt={user?.name ?? ''} />
							<Avatar.Fallback
								class="bg-hero-overlay-foreground/15 text-xs font-medium text-hero-overlay-foreground"
							>
								{initials(user?.name)}
							</Avatar.Fallback>
						</Avatar.Root>
					{/if}
				</button>
			{/snippet}
		</DropdownMenu.Trigger>

		<DropdownMenu.Content align="end" class="min-w-52">
			<DropdownMenu.Label class="font-normal">
				<div class="flex flex-col gap-0.5 px-0.5 py-1">
					<span class="truncate text-sm font-medium"
						>{user?.name ?? m['Header.NormalHeaderAuthActions.account']()}</span
					>
					{#if user?.email}
						<span class="truncate text-xs text-muted-foreground">{user.email}</span>
					{/if}
				</div>
			</DropdownMenu.Label>

			<DropdownMenu.Separator />

			<DropdownMenu.Group>
				<DropdownMenu.Item onclick={() => navigate(PROTECTED_PAGE_ENDPOINTS.GUEST_DASHBOARD)}>
					<LayoutDashboardIcon />
					{m['Header.NormalHeaderAuthActions.guestDashboard']()}
				</DropdownMenu.Item>

				<DropdownMenu.Item onclick={() => navigate(UNPROTECTED_PAGE_ENDPOINTS.REPORT)}>
					<FlagIcon />
					{m['Header.NormalHeaderAuthActions.reportAnIssue']()}
				</DropdownMenu.Item>
			</DropdownMenu.Group>

			<DropdownMenu.Separator />

			<!-- Logout set apart in its own group below the divider so it reads as a distinct action. -->
			<LogoutButton menuItem class="focus:bg-destructive/10" />
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
