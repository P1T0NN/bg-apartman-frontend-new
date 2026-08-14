<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import { AlertDialog } from '@/components/ui/alert-dialog';
	import { Button } from '@/components/ui/button/index.js';
	import { Textarea } from '@/components/ui/textarea/index.js';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { AdminAccommodationRow } from '@/shared/features/accommodation/types/accommodationTypes';

	// LUCIDE ICONS
	import { Loader } from '@lucide/svelte';

	/**
	 * Publish / suspend / archive, through the one existing `moderateApartmentStatus`
	 * mutation (AdminPagesSystemDesign.md §2).
	 *
	 * Every dialog names the concrete consequence in plain words — who goes live, who gets
	 * emailed, what the host will read. Suspension additionally COLLECTS the reason the
	 * mutation requires, with the copy stating that the host receives it verbatim: that one
	 * sentence is what prevents careless reasons.
	 */
	let {
		accommodation,
		action,
		open = $bindable(false)
	}: {
		accommodation: AdminAccommodationRow | null;
		action: 'published' | 'suspended' | 'archived';
		open?: boolean;
	} = $props();

	const convex = useConvexClient();

	let reason = $state('');
	let isPending = $state(false);

	const needsReason = $derived(action === 'suspended');
	const canSubmit = $derived(!needsReason || reason.trim().length >= 4);

	const copy = $derived.by(() => {
		const listing = accommodation?.title ?? m['AdminAccommodationsPage.AdminModerateAccommodationDialog.thisListing']();
		switch (action) {
			case 'published':
				return {
					title: m['AdminAccommodationsPage.AdminModerateAccommodationDialog.publishTitle'](),
					body: m['AdminAccommodationsPage.AdminModerateAccommodationDialog.publishBody']({ listing }),
					confirm: m['AdminAccommodationsPage.AdminModerateAccommodationDialog.publishListing'](),
					destructive: false
				};
			case 'suspended':
				return {
					title: m['AdminAccommodationsPage.AdminModerateAccommodationDialog.suspendTitle'](),
					body: m['AdminAccommodationsPage.AdminModerateAccommodationDialog.suspendBody']({ listing }),
					confirm: m['AdminAccommodationsPage.AdminModerateAccommodationDialog.suspendListing'](),
					destructive: true
				};
			case 'archived':
				return {
					title: m['AdminAccommodationsPage.AdminModerateAccommodationDialog.archiveTitle'](),
					body: m['AdminAccommodationsPage.AdminModerateAccommodationDialog.archiveBody']({ listing }),
					confirm: m['AdminAccommodationsPage.AdminModerateAccommodationDialog.archiveListing'](),
					destructive: true
				};
		}
	});

	async function submit() {
		if (!accommodation || !canSubmit) return;
		isPending = true;
		try {
			const result = await safeMutation(
				convex,
				api.tables.accommodations.mutations.updateAccommodation.moderateApartmentStatus,
				{
					id: accommodation._id as Id<'apartments'>,
					status: action,
					reason: needsReason ? reason.trim() : undefined,
					locale: 'en'
				}
			);
			if (!toastResult(result)) return;
			open = false;
		} finally {
			isPending = false;
		}
	}
</script>

<AlertDialog
	bind:open
	hideTrigger
	class={copy.destructive ? 'ring-destructive/30' : undefined}
	onOpenChange={(next) => {
		if (next) reason = '';
	}}
>
	<div class="alert-dialog__header">
		<h2 class={copy.destructive ? 'text-destructive' : undefined}>{copy.title}</h2>
		<p>{copy.body}</p>
	</div>

	{#if needsReason}
		<div class="flex flex-col gap-1.5">
			<label for="suspend-reason" class="text-sm font-medium">
				{m['AdminAccommodationsPage.AdminModerateAccommodationDialog.reasonForSuspending']()}
			</label>
			<Textarea
				id="suspend-reason"
				bind:value={reason}
				maxlength={500}
				rows={4}
				placeholder={m['AdminAccommodationsPage.AdminModerateAccommodationDialog.suspendReasonPlaceholder']()}
			/>
			<span
				class="self-end text-xs tabular-nums {reason.trim().length >= 4
					? 'text-muted-foreground'
					: 'text-destructive'}"
				aria-live="polite"
			>
				{Math.min(reason.trim().length, 4)}/4
			</span>
		</div>
	{/if}

	<div class="alert-dialog__footer">
		<Button type="button" variant="outline" onclick={() => (open = false)} disabled={isPending}>
			{m['AdminAccommodationsPage.AdminModerateAccommodationDialog.cancel']()}
		</Button>
		<Button
			type="button"
			variant={copy.destructive ? 'destructive' : 'default'}
			onclick={submit}
			disabled={isPending || !canSubmit}
		>
			{#if isPending}
				<Loader class="h-3 w-3 animate-spin" />
			{/if}
			{copy.confirm}
		</Button>
	</div>
</AlertDialog>
