<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import SearchFiltersClearButton from '../search-left-content/search-filters-clear-button.svelte';

	// TYPES
	import type { SearchState } from '../types';

	let { search }: { search: SearchState } = $props();
</script>

<div class="py-16 text-center">
	<p class="text-sm text-muted-foreground">{m['SearchPage.SearchFiltersEmpty.description']()}</p>

	<SearchFiltersClearButton {search} variant="link" size="sm">
		{m['SearchPage.SearchFiltersEmpty.clearFilters']()}
	</SearchFiltersClearButton>
</div>
