<script lang="ts" generics="Item">
	// TYPES
	import type { Snippet } from 'svelte';
	import type { GoogleMapMarkerContext } from './types.js';

	// Internal: bridges a Svelte snippet into the detached DOM node that
	// AdvancedMarkerElement.content expects. Mounted lazily by the controller only
	// for on-screen markers; `item` and the shared `context` update reactively
	// (never remounted).
	let {
		content,
		item,
		context
	}: {
		content: Snippet<[Item, GoogleMapMarkerContext]>;
		item: Item;
		context: GoogleMapMarkerContext;
	} = $props();
</script>

{@render content(item, context)}
