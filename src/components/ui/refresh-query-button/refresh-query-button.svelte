<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// SVELTEKIT IMPORTS
	import { invalidateAll } from '$app/navigation';

	// COMPONENTS
	import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/button/index.js';

	// LUCIDE ICONS
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';

	let {
		label = m['RefreshQueryButton.tryAgain'](),
		variant = 'default',
		size = 'default',
		class: className
	}: {
		label?: string;
		variant?: ButtonVariant;
		size?: ButtonSize;
		class?: string;
	} = $props();

	function refresh() {
		invalidateAll();
	}
</script>

<Button {variant} {size} class={className} onclick={refresh}>
	<RefreshCwIcon class="size-4" aria-hidden="true" />
	{label}
</Button>
