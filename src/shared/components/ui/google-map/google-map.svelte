<script lang="ts" generics="Item extends GoogleMapMarkerData">
	// SVELTEKIT IMPORTS
	import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';
	import { onMount, untrack } from 'svelte';

	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages.js';

	// UTILS
	import { cn } from '@/shared/utils/utils.js';
	import {
		createGoogleMap,
		GoogleMapController,
		loadGoogleMapsLibraries
	} from './google-map.svelte.js';

	// TYPES
	import type { GoogleMapMarkerData, GoogleMapMarkerId, GoogleMapProps } from './types.js';

	// NOTE: Further performance lever if 1000+ markers ever feel heavy on weak
	// hardware — at very low zoom, skip `markerContent` and render the default
	// google.maps PinElement instead of the custom Svelte tag, switching back to
	// the rich tag past a zoom threshold. Test before reaching for it: viewport
	// virtualization + clustering already settle 1000 markers comfortably.

	let {
		center = { lat: 45.815, lng: 15.9819 },
		zoom = 12,
		options,
		markers = [],
		cluster = false,
		fitBounds = false,
		onMarkerClick,
		markerContent,
		overlay,
		class: className
	}: GoogleMapProps<Item> = $props();

	let mapEl = $state<HTMLDivElement>();
	let controller = $state.raw<GoogleMapController<Item>>();
	let error = $state<string | null>(null);
	let requestedFocusId: GoogleMapMarkerId | null = null;
	let requestedSelectedId: GoogleMapMarkerId | null = null;

	export function setFocus(id: GoogleMapMarkerId | null) {
		requestedFocusId = id;
		controller?.focusOn(id);
	}

	export function setSelected(id: GoogleMapMarkerId | null) {
		requestedSelectedId = id;
		controller?.setSelected(id);
	}

	onMount(() => {
		if (!PUBLIC_GOOGLE_MAPS_API_KEY) {
			error = 'Missing PUBLIC_GOOGLE_MAPS_API_KEY environment variable.';
			return;
		}

		let cancelled = false;

		loadGoogleMapsLibraries(PUBLIC_GOOGLE_MAPS_API_KEY)
			.then((libraries) => {
				if (cancelled || !mapEl) return;

				const map = createGoogleMap(mapEl, libraries.maps, center, zoom, options);
				const nextController = new GoogleMapController<Item>(map, libraries);
				controller = nextController;
				nextController.setSelected(requestedSelectedId);
				nextController.focusOn(requestedFocusId);
			})
			.catch((loadError: unknown) => {
				if (cancelled) return;
				error = loadError instanceof Error ? loadError.message : m['GoogleMap.failedToLoad']();
			});

		return () => {
			cancelled = true;
			controller?.destroy();
			controller = undefined;
		};
	});

	$effect(() => {
		controller?.setView(center, zoom);
	});

	$effect(() => {
		const currentController = controller;
		const markerItems = markers;
		const clusterSetting = cluster;
		const fitBoundsSetting = fitBounds;
		const markerClickHandler = onMarkerClick;
		const markerContentSnippet = markerContent;

		if (!currentController) return;

		untrack(() => {
			currentController.sync({
				markers: markerItems,
				cluster: clusterSetting,
				fitBounds: fitBoundsSetting,
				onMarkerClick: markerClickHandler,
				markerContent: markerContentSnippet
			});
		});
	});
</script>

{#if error}
	<div
		class={cn(
			'flex h-[400px] w-full items-center justify-center rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground',
			className
		)}
	>
		{error}
	</div>
{:else}
	<div class={cn('relative h-[400px] w-full overflow-hidden rounded-lg', className)}>
		<div bind:this={mapEl} class="absolute inset-0"></div>
		{#if overlay}
			{@render overlay()}
		{/if}
	</div>
{/if}
