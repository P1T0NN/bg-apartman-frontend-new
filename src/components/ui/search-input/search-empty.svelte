<script lang="ts">
	type Props = {
		title?: string;
		description?: string;
	};

	let { title = 'No results found', description = 'Try a different search term.' }: Props =
		$props();
</script>

<div class="px-3 py-6 text-center">
	<p class="text-sm font-medium">{title}</p>
	<p class="mt-1 text-xs text-muted-foreground">{description}</p>
</div>
