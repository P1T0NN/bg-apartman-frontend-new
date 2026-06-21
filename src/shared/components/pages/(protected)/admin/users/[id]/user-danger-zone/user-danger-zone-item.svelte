<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * One row of the user danger zone: title + description on the left, an
	 * action affordance (button, ActionButton, etc.) on the right. Stacks on
	 * mobile, side-by-side from `md` up.
	 */
	let {
		title,
		description,
		children
	}: {
		title: string;
		description: string;
		children: Snippet;
	} = $props();
</script>

<div
	class="border-destructive/30 flex flex-col items-start justify-between gap-3 rounded-md border p-4 md:flex-row md:items-center"
>
	<div class="flex flex-col gap-0.5">
		<h3 class="text-sm font-semibold">{title}</h3>
		<p class="text-muted-foreground text-sm">{description}</p>
	</div>
	<div class="shrink-0">{@render children()}</div>
</div>
