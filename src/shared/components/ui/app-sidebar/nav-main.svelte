<script lang="ts">
	// LIBRARIES
	import { localizeHref } from '@/shared/lib/paraglide/runtime.js';

	// COMPONENTS
	import * as Sidebar from '@/shared/components/ui/sidebar/index.js';

	// TYPES
	import type { AppSidebarNavGroupWithActive } from './types.js';

	let {
		groups
	}: {
		groups: AppSidebarNavGroupWithActive[];
	} = $props();
</script>

{#each groups as group, i (group.label ?? `group-${i}`)}
	<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
		{#if group.label}
			<Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
		{/if}
		<Sidebar.Menu class="gap-2">
			{#each group.items as item (item.name)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton isActive={item.isActive}>
						{#snippet child({ props })}
							<a href={localizeHref(item.url)} {...props}>
								<item.icon />
								<span>{item.name}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
					{#if item.badge}
						<Sidebar.MenuBadge
							class="rounded-full bg-amber-500/15 px-1.5 text-amber-700 dark:text-amber-300"
						>
							{item.badge}
						</Sidebar.MenuBadge>
					{/if}
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.Group>
{/each}
