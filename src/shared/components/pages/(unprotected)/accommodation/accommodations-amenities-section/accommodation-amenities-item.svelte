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

<li class="flex items-center gap-3 text-sm">
	<Icon class="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
	<span>{label}</span>
</li>
