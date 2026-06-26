<script lang="ts">
	// SVELTEKIT
	import { goto } from '$app/navigation';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/constants';

	// COMPONENTS
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '@/shared/components/ui/card/index.js';
	import ActionButton from '@/shared/components/ui/action-button/action-button.svelte';
	import { Input } from '@/shared/components/ui/input/index.js';

	// UTILS
	import { safeMutation } from '@/shared/utils/convexHelpers';
	import { toastResult } from '@/shared/utils/toastResult';

	// LUCIDE ICONS
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	type ApartmentStatus = Doc<'apartments'>['status'];

	let { accommodation }: { accommodation: Doc<'apartments'> } = $props();

	const convex = useConvexClient();

	let statusPending = $state(false);
	let deletePending = $state(false);
	let typedConfirm = $state('');

	const isArchived = $derived(accommodation.status === 'archived');
	const isSuspended = $derived(accommodation.status === 'suspended');

	function statusLabel(status: ApartmentStatus): string {
		switch (status) {
			case 'pending_review':
				return 'Pending review';
			case 'published':
				return 'Published';
			case 'suspended':
				return 'Suspended';
			case 'archived':
				return 'Unlisted';
		}
	}

	function statusClass(status: ApartmentStatus): string {
		switch (status) {
			case 'pending_review':
				return 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300';
			case 'published':
				return 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300';
			case 'suspended':
				return 'bg-destructive/10 text-destructive ring-destructive/20';
			case 'archived':
				return 'bg-muted text-muted-foreground ring-border';
		}
	}

	async function setStatus(next: 'archived' | 'pending_review') {
		statusPending = true;
		try {
			const result = await safeMutation(
				convex,
				api.tables.accommodations.mutations.updateAccommodation.setApartmentStatus,
				{ id: accommodation._id, status: next }
			);
			toastResult(result);
		} finally {
			statusPending = false;
		}
	}

	async function deleteListing() {
		if (typedConfirm !== accommodation.title) return;
		deletePending = true;
		try {
			const result = await safeMutation(
				convex,
				api.tables.accommodations.mutations.deleteAccommodation.deleteApartment,
				{ ids: [accommodation._id] }
			);
			if (!toastResult(result)) return;
			await goto(localizeHref(PROTECTED_PAGE_ENDPOINTS.MY_ACCOMMODATIONS));
		} finally {
			deletePending = false;
		}
	}
</script>

{#snippet confirmBody()}
	<Input bind:value={typedConfirm} placeholder={accommodation.title} disabled={deletePending} />
{/snippet}

<div class="flex flex-col gap-6">
	<Card>
		<CardHeader>
			<CardTitle>Visibility</CardTitle>
			<CardDescription>Control whether this listing is publicly discoverable.</CardDescription>
		</CardHeader>
		<CardContent class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-3">
				<span class="text-sm text-muted-foreground">Current status</span>
				<span
					class={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${statusClass(accommodation.status)}`}
				>
					{statusLabel(accommodation.status)}
				</span>
			</div>

			{#if isSuspended}
				<p class="text-sm text-muted-foreground">Suspended by an administrator.</p>
			{:else if isArchived}
				<ActionButton
					function={() => setStatus('pending_review')}
					isPending={statusPending}
					title="Relist this property?"
					description="It will be sent for review and become publicly visible once approved."
				>
					<EyeIcon class="size-4" />
					Relist
				</ActionButton>
			{:else}
				<ActionButton
					function={() => setStatus('archived')}
					variant="outline"
					isPending={statusPending}
					title="Unlist this property?"
					description="It will be hidden from search and its public page until you relist it."
				>
					<EyeOffIcon class="size-4" />
					Unlist
				</ActionButton>
			{/if}
		</CardContent>
	</Card>

	<Card class="border-destructive/30">
		<CardHeader>
			<CardTitle class="text-destructive">Danger zone</CardTitle>
			<CardDescription>
				Deleting a listing is permanent — its photos and details are removed for good.
			</CardDescription>
		</CardHeader>
		<CardContent class="flex justify-end">
			<ActionButton
				function={deleteListing}
				variant="destructive"
				isDestructive
				isPending={deletePending}
				actionDisabled={typedConfirm !== accommodation.title}
				title="Delete this listing?"
				description={`Type the listing title "${accommodation.title}" to confirm. This can't be undone.`}
				body={confirmBody}
			>
				<Trash2Icon class="size-4" />
				Delete listing
			</ActionButton>
		</CardContent>
	</Card>
</div>
