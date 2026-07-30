<script lang="ts">
	// TYPES
	import type { Component } from 'svelte';

	let {
		icon,
		label
	}: {
		icon: Component;
		label: string;
	} = $props();

	const Icon = $derived(icon);
</script>

<span class="flex items-center gap-1.5 text-sm text-foreground">
	<Icon class="size-4 text-muted-foreground" aria-hidden="true" />
	{label}
</span>
