<script lang="ts">
	// COMPONENTS
	import { Button, type ButtonProps } from '@/shared/components/ui/button/index.js';

	// STATE
	import { clearFilters } from '../search-state';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { SearchState } from '../types';

	// A plain Button that resets all filters. Appearance is the caller's (pass variant/
	// size/class + the label as children); only the clear action is baked in.
	let {
		search,
		children,
		...rest
	}: { search: SearchState; children?: Snippet } & Omit<ButtonProps, 'onclick' | 'children'> =
		$props();
</script>

<Button {...rest} onclick={() => clearFilters(search)}>
	{@render children?.()}
</Button>
