<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// SVELTEKIT

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// UTILS
	import { appGoto } from '@/utils/app-navigation.js';

	// COMPONENTS
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '@/components/ui/card/index.js';
	import ActionButton from '@/components/ui/action-button/action-button.svelte';
	import { Input } from '@/components/ui/input/index.js';
	import { FeatureStatus } from '@/components/ui/feature-status/index.js';

	// DATA
	import { ACCOMMODATION_STATUS_CONFIG } from '@/features/accommodations/data/accommodationsData';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	// LUCIDE ICONS
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	let { accommodation }: { accommodation: Doc<'apartments'> } = $props();

	const convex = useConvexClient();

	let statusPending = $state(false);
	let deletePending = $state(false);
	let typedConfirm = $state('');

	const isArchived = $derived(accommodation.status === 'archived');
	const isSuspended = $derived(accommodation.status === 'suspended');

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

	async function deleteAccommodation() {
		if (typedConfirm !== accommodation.title) return;
		deletePending = true;
		try {
			const result = await safeMutation(
				convex,
				api.tables.accommodations.mutations.deleteAccommodation.deleteApartment,
				{ ids: [accommodation._id] }
			);
			if (!toastResult(result)) return;
			await appGoto(PROTECTED_PAGE_ENDPOINTS.MY_ACCOMMODATIONS);
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
			<CardTitle
				>{m['HostEditAccommodationPage.EditAccommodationSettingsTab.visibilityTitle']()}</CardTitle
			>
			<CardDescription>
				{m['HostEditAccommodationPage.EditAccommodationSettingsTab.visibilityDescription']()}
			</CardDescription>
		</CardHeader>
		<CardContent class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-3">
				<span class="text-sm text-muted-foreground">
					{m['HostEditAccommodationPage.EditAccommodationSettingsTab.currentStatus']()}
				</span>
				<FeatureStatus config={ACCOMMODATION_STATUS_CONFIG} status={accommodation.status} />
			</div>

			{#if isSuspended}
				<p class="text-sm text-muted-foreground">
					{m['HostEditAccommodationPage.EditAccommodationSettingsTab.suspendedByAdmin']()}
				</p>
			{:else if isArchived}
				<ActionButton
					function={() => setStatus('pending_review')}
					isPending={statusPending}
					title={m['HostEditAccommodationPage.EditAccommodationSettingsTab.relistTitle']()}
					description={m[
						'HostEditAccommodationPage.EditAccommodationSettingsTab.relistDescription'
					]()}
				>
					<EyeIcon class="size-4" />
					{m['HostEditAccommodationPage.EditAccommodationSettingsTab.relist']()}
				</ActionButton>
			{:else}
				<ActionButton
					function={() => setStatus('archived')}
					variant="outline"
					isPending={statusPending}
					title={m['HostEditAccommodationPage.EditAccommodationSettingsTab.unlistTitle']()}
					description={m[
						'HostEditAccommodationPage.EditAccommodationSettingsTab.unlistDescription'
					]()}
				>
					<EyeOffIcon class="size-4" />
					{m['HostEditAccommodationPage.EditAccommodationSettingsTab.unlist']()}
				</ActionButton>
			{/if}
		</CardContent>
	</Card>

	<Card class="border-destructive/30">
		<CardHeader>
			<CardTitle class="text-destructive">
				{m['HostEditAccommodationPage.EditAccommodationSettingsTab.dangerZoneTitle']()}
			</CardTitle>
			<CardDescription>
				{m['HostEditAccommodationPage.EditAccommodationSettingsTab.dangerZoneDescription']()}
			</CardDescription>
		</CardHeader>
		<CardContent class="flex justify-end">
			<ActionButton
				function={deleteAccommodation}
				variant="destructive"
				isDestructive
				isPending={deletePending}
				actionDisabled={typedConfirm !== accommodation.title}
				title={m['HostEditAccommodationPage.EditAccommodationSettingsTab.deleteTitle']()}
				description={m['HostEditAccommodationPage.EditAccommodationSettingsTab.deleteDescription']({
					title: accommodation.title
				})}
				body={confirmBody}
			>
				<Trash2Icon class="size-4" />
				{m['HostEditAccommodationPage.EditAccommodationSettingsTab.deleteAccommodation']()}
			</ActionButton>
		</CardContent>
	</Card>
</div>
