<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	type Props = {
		title?: string;
		description?: string;
	};

	let {
		title = m['SearchInput.SearchEmpty.noResults'](),
		description = m['SearchInput.SearchEmpty.tryDifferentTerm']()
	}: Props = $props();
</script>

<div class="px-3 py-6 text-center">
	<p class="text-sm font-medium">{title}</p>
	<p class="mt-1 text-xs text-muted-foreground">{description}</p>
</div>
