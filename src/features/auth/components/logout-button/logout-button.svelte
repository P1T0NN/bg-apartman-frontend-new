<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import * as DropdownMenu from '@/shared/components/ui/dropdown-menu/index.js';
	import Button from '@/shared/components/ui/button/button.svelte';
	import Spinner from '@/shared/components/ui/spinner/spinner.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { useLogout } from './logout-button.svelte.js';

	// TYPES
	import type { ClassValue } from 'clsx';

	// LUCIDE ICONS
	import LogOutIcon from '@lucide/svelte/icons/log-out';

	let {
		variant = 'destructive',
		class: className,
		disabled = false,
		/**
		 * Render as a `DropdownMenu.Item` (for use inside a `DropdownMenu.Content`,
		 * e.g. the sidebar user menu). When false, renders a standalone `Button`,
		 * which is required outside of a dropdown (e.g. the header), since
		 * `DropdownMenu.Item` throws without a `Menu.Content` context.
		 */
		menuItem = false,
		isLoggingOut = $bindable(false)
	}: {
		variant?: 'default' | 'destructive';
		class?: ClassValue;
		disabled?: boolean;
		menuItem?: boolean;
		isLoggingOut?: boolean;
	} = $props();

	const { isLoggingOut: loggingOut, logout } = useLogout();

	$effect(() => {
		isLoggingOut = loggingOut;
	});
</script>

{#if menuItem}
	<DropdownMenu.Item {variant} disabled={disabled || loggingOut} onclick={logout} class={cn(className)}>
		{#if loggingOut}
			<Spinner />
		{:else}
			<LogOutIcon />
		{/if}
		<span>{m['LogoutButton.logout']()}</span>
	</DropdownMenu.Item>
{:else}
	<Button {variant} disabled={disabled || loggingOut} onclick={logout} class={cn(className)}>
		{#if loggingOut}
			<Spinner />
		{:else}
			<LogOutIcon />
		{/if}
		<span>{m['LogoutButton.logout']()}</span>
	</Button>
{/if}
