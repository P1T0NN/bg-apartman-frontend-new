<script lang="ts">
	// LIBRARIES
	import { loadMapLibrary, type GoogleMap, type GoogleMarker } from '@/shared/lib/google-maps/maps';
	import { m } from '@/shared/lib/paraglide/messages';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// LUCIDE ICONS
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

	let {
		lat,
		lng,
		zoom = 15,
		class: className
	}: {
		lat?: number | null;
		lng?: number | null;
		zoom?: number;
		class?: string;
	} = $props();

	const hasCoords = $derived(typeof lat === 'number' && typeof lng === 'number');

	let container = $state<HTMLDivElement | null>(null);
	let map: GoogleMap | null = null;
	let marker: GoogleMarker | null = null;
	let loading = $state(false);
	let errorMsg = $state<string | null>(null);

	// Build the map once coordinates + the container exist; thereafter just recenter.
	$effect(() => {
		if (!hasCoords || !container) return;
		const position = { lat: lat as number, lng: lng as number };

		if (map) {
			map.setCenter(position);
			marker?.setPosition(position);
			return;
		}

		let cancelled = false;
		loading = true;
		errorMsg = null;

		loadMapLibrary()
			.then(({ Map, Marker }) => {
				if (cancelled || !container) return;
				map = new Map(container, {
					center: position,
					zoom,
					disableDefaultUI: true,
					zoomControl: true,
					clickableIcons: false,
					gestureHandling: 'cooperative'
				});
				marker = new Marker({ position, map });
			})
			.catch((err) => {
				if (cancelled) return;
				console.error('[location-map] failed to load map:', err);
				errorMsg = err instanceof Error ? err.message : m['LocationMap.error']();
			})
			.finally(() => {
				if (!cancelled) loading = false;
			});

		return () => {
			cancelled = true;
		};
	});
</script>

{#if !hasCoords}
	<div
		class={cn(
			'flex aspect-16/7 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 text-center',
			className
		)}
	>
		<MapPinIcon class="size-7 text-muted-foreground" />
		<p class="text-sm font-medium">{m['LocationMap.mapLocation']()}</p>
		<p class="max-w-xs text-xs text-muted-foreground">
			{m['LocationMap.description']()}
		</p>
	</div>
{:else}
	<div
		class={cn('relative aspect-16/7 w-full overflow-hidden rounded-lg border bg-muted', className)}
	>
		<div bind:this={container} class="h-full w-full"></div>

		{#if loading}
			<div class="absolute inset-0 flex items-center justify-center bg-muted/60">
				<LoaderCircleIcon class="size-6 animate-spin text-muted-foreground" />
			</div>
		{/if}

		{#if errorMsg}
			<div
				class="absolute inset-0 flex items-center justify-center bg-muted/90 px-4 text-center text-sm text-destructive"
			>
				{errorMsg}
			</div>
		{/if}
	</div>
{/if}
