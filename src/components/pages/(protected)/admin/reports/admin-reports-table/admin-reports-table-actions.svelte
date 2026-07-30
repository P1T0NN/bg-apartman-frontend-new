<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';
	import { toast } from 'svelte-sonner';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { translateFromBackend } from '@/utils/translateFromBackend';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { AdminReportRow } from '@/convex/tables/reports/queries/listReportsSafe';

	// LUCIDE ICONS
	import { Loader } from '@lucide/svelte';

	/**
	 * Resolve/reopen with undo instead of a confirm dialog — the action is reversible, and a
	 * dialog per click is real cognitive load for something one more click takes back
	 * (AdminPagesSystemDesign.md §4).
	 *
	 * The row is the only prop: the list is a subscription, so a successful toggle repaints
	 * this row on its own, and `pending` belongs to the one button that is in flight.
	 */
	let { report }: { report: AdminReportRow } = $props();

	const convex = useConvexClient();

	const isResolved = $derived(report.status === 'resolved');

	let pending = $state(false);

	function setStatus(status: AdminReportRow['status']) {
		return safeMutation(convex, api.tables.reports.mutations.setReportStatus.setReportStatus, {
			id: report._id as Id<'reports'>,
			status
		});
	}

	async function handleToggleStatus() {
		// Captured before the mutation: the row repaints underneath us, and Undo must restore
		// the status this click started from.
		const previous = report.status;
		pending = true;
		try {
			const result = await setStatus(previous === 'resolved' ? 'new' : 'resolved');
			if (!result) return;
			if (!result.success) {
				toast.error(translateFromBackend(result.message));
				return;
			}

			toast.success(translateFromBackend(result.message), {
				action: {
					label: 'Undo',
					onClick: () => void setStatus(previous)
				}
			});
		} finally {
			pending = false;
		}
	}
</script>

<Button
	variant={isResolved ? 'ghost' : 'outline'}
	size="sm"
	disabled={pending}
	onclick={handleToggleStatus}
>
	{#if pending}
		<Loader class="h-3 w-3 animate-spin" />
	{/if}
	{isResolved ? 'Reopen' : 'Resolve'}
</Button>
