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

<li class="flex items-center gap-3 text-sm text-muted-foreground">
	<Icon class="size-4 shrink-0" aria-hidden="true" />
	<span>{label}</span>
</li>
