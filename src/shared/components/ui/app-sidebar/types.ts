// TYPES
import type { Component } from 'svelte';

export type AppSidebarNavItem = {
	name: string;
	url: string;
	icon: Component;
	/** Render as a stand-out CTA (filled primary) instead of a plain link. */
	highlight?: boolean;
};

export type AppSidebarNavItemWithActive = AppSidebarNavItem & {
	isActive?: boolean;
};

export type AppSidebarNavItems = {
	navMain: AppSidebarNavItem[];
	navSecondary?: AppSidebarNavItem[];
};
