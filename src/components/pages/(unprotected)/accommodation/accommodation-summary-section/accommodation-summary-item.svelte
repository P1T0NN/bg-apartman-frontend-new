<script lang="ts">
	// TYPES
	import type { Component } from 'svelte';

	let {
		icon,
		title,
		text
	}: {
		icon: Component;
		title: string;
		text: string;
	} = $props();

	const Icon = $derived(icon);
</script>

<li class="flex items-start gap-4">
	<Icon class="mt-0.5 size-6 shrink-0 text-foreground" aria-hidden="true" />

	<div class="space-y-0.5">
		<p class="text-sm font-medium">{title}</p>
		<p class="text-sm leading-relaxed text-muted-foreground">{text}</p>
	</div>
</li>
