<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints';

	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import { Button } from '@/shared/components/ui/button/index.js';
	import Link from '@/shared/components/ui/link/link.svelte';

	// LUCIDE ICONS
	import CompassIcon from '@lucide/svelte/icons/compass';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import HouseIcon from '@lucide/svelte/icons/house';

	const isNotFound = $derived(page.status === 404);
</script>

<SvelteHead
	title={isNotFound ? 'Page not found' : 'Something went wrong'}
	description="BGApartman"
	noIndex
/>

<!-- Fill the viewport below the sticky h-14 header so the footer stays below the fold. -->
<div
	class="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8"
>
	<div
		class="flex w-full max-w-xl flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center
			{isNotFound ? '' : 'border-destructive/30 bg-destructive/5'}"
	>
		<div
			class="flex size-14 items-center justify-center rounded-full
				{isNotFound ? 'bg-muted text-muted-foreground' : 'bg-destructive/10 text-destructive'}"
		>
			{#if isNotFound}
				<CompassIcon class="size-7" aria-hidden="true" />
			{:else}
				<TriangleAlertIcon class="size-7" aria-hidden="true" />
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<p class="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
				{page.status}
			</p>
			<h1 class="text-lg font-semibold">
				{isNotFound ? "This page doesn't exist" : 'Something went wrong'}
			</h1>
			<p class="mx-auto max-w-sm text-sm text-muted-foreground">
				{isNotFound
					? 'The link may be outdated, or the page may have moved. Let’s get you back to a good place.'
					: 'An unexpected error occurred. Please try again in a moment — if it keeps happening, let us know.'}
			</p>
		</div>

		<div class="flex flex-wrap items-center justify-center gap-2">
			<Button href={UNPROTECTED_PAGE_ENDPOINTS.ROOT}>
				<HouseIcon class="size-4" aria-hidden="true" />
				Back to home
			</Button>

			{#if !isNotFound}
				<Button variant="outline" onclick={() => location.reload()}>Try again</Button>
			{/if}
		</div>

		{#if !isNotFound}
			<p class="text-xs text-muted-foreground/80">
				Keeps happening?
				<Link href={UNPROTECTED_PAGE_ENDPOINTS.REPORT} class="underline underline-offset-2">
					Report the issue
				</Link>
			</p>
		{/if}
	</div>
</div>
