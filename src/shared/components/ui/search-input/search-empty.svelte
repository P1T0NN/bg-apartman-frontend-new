<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	type Props = {
		title?: string;
		description?: string;
	};

	let {
		title = m['SearchInput.SearchEmpty.title'](),
		description = m['SearchInput.SearchEmpty.description']()
	}: Props = $props();
</script>

<div class="px-3 py-6 text-center">
	<p class="text-sm font-medium">{title}</p>
	<p class="text-muted-foreground mt-1 text-xs">{description}</p>
</div>
