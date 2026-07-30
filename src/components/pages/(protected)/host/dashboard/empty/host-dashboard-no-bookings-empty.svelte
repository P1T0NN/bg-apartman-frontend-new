<script lang="ts">
	// LUCIDE ICONS
	import PartyPopperIcon from '@lucide/svelte/icons/party-popper';
</script>

<div
	class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-12 text-center"
>
	<div class="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
		<PartyPopperIcon class="size-7" aria-hidden="true" />
	</div>

	<div class="flex flex-col gap-1.5">
		<h2 class="text-base font-semibold tracking-tight">You're ready for your first booking</h2>

		<p class="mx-auto max-w-sm text-sm text-muted-foreground">
			Your accommodations are live. Share them to start receiving requests.
		</p>
	</div>
</div>
