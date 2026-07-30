<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	// UTILS
	import { safeAction } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';

	let { apartmentId }: { apartmentId: Id<'apartments'> } = $props();

	const convex = useConvexClient();

	let renewing = $state(false);

	async function handleRenewButton() {
		renewing = true;
		try {
			const result = await safeAction(convex, api.payments.listingFee.renewListing, {
				apartmentId
			});
			// The list is a subscription, so a successful renewal repaints the row itself.
			toastResult(result);
		} finally {
			renewing = false;
		}
	}
</script>

<Button
	onclick={handleRenewButton}
	disabled={renewing}
	variant="outline"
	size="sm"
	class="self-start"
>
	{#if renewing}
		<Spinner />
	{/if}
	Renew
</Button>
