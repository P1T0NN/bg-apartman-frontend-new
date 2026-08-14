<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';

	// STATE
	import { removeFilter } from '../search-state';

	// TYPES
	import type { ActiveFilter, SearchState } from '../types';

	// LUCIDE ICONS
	import XIcon from '@lucide/svelte/icons/x';

	let { search, chip }: { search: SearchState; chip: ActiveFilter } = $props();

	const remove = () => removeFilter(search, chip.key);
</script>

<!-- The whole chip is the remove target (one big tap area); role/keydown make the
     non-button Badge keyboard-accessible. -->
<Badge
	variant="outline"
	role="button"
	tabindex={0}
	aria-label={m['SearchPage.SearchFiltersBadge.removeFilter']({ label: chip.label })}
	onclick={remove}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			remove();
		}
	}}
	class="h-auto cursor-pointer gap-1 bg-muted/40 py-1 pr-1.5 pl-3 transition hover:bg-muted"
>
	{chip.label}
	<XIcon class="size-3.5 text-muted-foreground" aria-hidden="true" />
</Badge>
