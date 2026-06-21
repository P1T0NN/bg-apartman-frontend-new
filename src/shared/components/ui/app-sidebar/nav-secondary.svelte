<script lang="ts">
	// LIBRARIES
	import { localizeHref } from '@/shared/lib/paraglide/runtime.js';

	// COMPONENTS
	import * as Sidebar from '@/shared/components/ui/sidebar/index.js';

	// TYPES
	import type { ComponentProps } from 'svelte';
	import type { AppSidebarNavItemWithActive } from './types.js';

	let {
		items,
		...restProps
	}: {
		items: AppSidebarNavItemWithActive[];
	} & ComponentProps<typeof Sidebar.Group> = $props();
</script>

<Sidebar.Group {...restProps}>
	<Sidebar.GroupContent>
		<Sidebar.Menu class="gap-2">
			{#each items as item (item.name)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton size="sm" isActive={item.isActive}>
						{#snippet child({ props })}
							<a href={localizeHref(item.url)} {...props}>
								<item.icon />
								<span>{item.name}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
