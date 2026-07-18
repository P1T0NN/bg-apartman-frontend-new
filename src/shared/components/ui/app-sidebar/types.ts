// TYPES
import type { Component } from 'svelte';

export type AppSidebarNavItem = {
	name: string;
	url: string;
	icon: Component;
	/** Render as a stand-out CTA (filled primary) instead of a plain link. */
	highlight?: boolean;
	/** Small count badge after the label (e.g. pending-review count, "50+"). */
	badge?: string;
};

export type AppSidebarNavItemWithActive = AppSidebarNavItem & {
	isActive?: boolean;
};

/** A section of the main nav. `label` renders as a heading above the items; omit it for an unlabeled group. */
export type AppSidebarNavGroup = {
	label?: string;
	items: AppSidebarNavItem[];
};

export type AppSidebarNavGroupWithActive = {
	label?: string;
	items: AppSidebarNavItemWithActive[];
};

export type AppSidebarNavItems = {
	navMain: AppSidebarNavGroup[];
	navSecondary?: AppSidebarNavItem[];
};
