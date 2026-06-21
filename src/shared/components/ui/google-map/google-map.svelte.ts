// SVELTEKIT IMPORTS
import { mount, unmount } from 'svelte';

// LIBRARIES
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

// COMPONENTS
import MarkerPortal from './marker-portal.svelte';

// TYPES
import type { Component, Snippet } from 'svelte';
import type {
	GoogleMapAdvancedMarker,
	GoogleMapCenter,
	GoogleMapClusterOptions,
	GoogleMapFitBoundsOptions,
	GoogleMapInstance,
	GoogleMapMarkerContext,
	GoogleMapMarkerData,
	GoogleMapMarkerId,
	GoogleMapOptions,
	GoogleMapProps,
	GoogleMapsLibraries
} from './types.js';

type MountedApp = ReturnType<typeof mount>;
type MapsEventListener = ReturnType<GoogleMapInstance['addListener']>;

type MarkerPortalProps<Item extends GoogleMapMarkerData> = {
	content: Snippet<[Item, GoogleMapMarkerContext]>;
	item: Item;
	context: GoogleMapMarkerContext;
};

type MarkerPortalHandle<Item extends GoogleMapMarkerData> = {
	app: MountedApp;
	props: MarkerPortalProps<Item>;
};

type MarkerRecord<Item extends GoogleMapMarkerData> = {
	marker: GoogleMapAdvancedMarker;
	item: Item;
	lat: number;
	lng: number;
	clickHandler?: EventListener;
	portal?: MarkerPortalHandle<Item>;
};

type GoogleMapControllerSyncOptions<Item extends GoogleMapMarkerData> = {
	markers: readonly Item[];
	cluster: boolean | GoogleMapClusterOptions;
	fitBounds: boolean | GoogleMapFitBoundsOptions;
	onMarkerClick: GoogleMapProps<Item>['onMarkerClick'];
	markerContent: GoogleMapProps<Item>['markerContent'];
};

type DetachableMarkerClusterer = MarkerClusterer & {
	setMap(map: GoogleMapInstance | null): void;
};

let isConfigured = false;
let librariesPromise: Promise<GoogleMapsLibraries> | undefined;

export function loadGoogleMapsLibraries(apiKey: string): Promise<GoogleMapsLibraries> {
	if (!isConfigured) {
		setOptions({ key: apiKey, v: 'weekly' });
		isConfigured = true;
	}

	librariesPromise ??= Promise.all([
		importLibrary('maps'),
		importLibrary('marker'),
		importLibrary('core')
	])
		.then(([maps, marker, core]) => ({ maps, marker, core }))
		.catch((loadError: unknown) => {
			librariesPromise = undefined;
			throw loadError;
		});

	return librariesPromise;
}

// NOTE: AdvancedMarkerElement (what this component renders) requires a Map ID, which
// is why we default to Google's shared 'DEMO_MAP_ID' below. For production, create
// your own — it takes ~2 minutes and is free (you're billed per map load exactly the
// same; the Map ID itself costs nothing):
//   1. Google Cloud Console → Google Maps Platform → Map Management (Map IDs).
//   2. Create Map ID → Map type: JavaScript, rendering: Vector (recommended) → Save.
//   3. You get an ID like 8f1b3c.... Optionally attach a map style to it for custom colors.
//   4. Pass it through — the component already supports this, no code change needed:
//        <GoogleMap options={{ mapId: 'YOUR_MAP_ID' }} ... />
//      The mapId line below does `options?.mapId ?? 'DEMO_MAP_ID'`, so your real ID
//      overrides the demo automatically.
//
// So: it's not a security/cost thing — it's "use your own supported, styleable map
// config instead of Google's shared test one."
export function createGoogleMap(
	mapElement: HTMLElement,
	mapsLibrary: GoogleMapsLibraries['maps'],
	center: GoogleMapCenter,
	zoom: number,
	options?: GoogleMapOptions
): GoogleMapInstance {
	return new mapsLibrary.Map(mapElement, {
		...options,
		mapId: options?.mapId ?? 'DEMO_MAP_ID',
		center,
		zoom
	});
}

// Hover-to-focus camera drive. When a card highlights a marker that's buried in a
// cluster, we step the zoom in (centered on the marker) until the cluster splits and
// the marker stands alone, then glide it to the center. FOCUS_MAX_ZOOM caps the drill
// so near-identical coordinates can't rocket the camera to street level.
const FOCUS_ZOOM_STEP = 2;
const FOCUS_MAX_ZOOM = 17;

export class GoogleMapController<Item extends GoogleMapMarkerData> {
	// This registry is intentionally nonreactive; sync() owns all mutations.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	private readonly markerRecords = new Map<GoogleMapMarkerId, MarkerRecord<Item>>();
	// One immutable snapshot of map + interaction state shared by every mounted portal.
	// Each change rebuilds it and reassigns it to each portal's props — that reference
	// swap is what reliably re-renders them (the same channel as an item update), with
	// no dependence on nested-proxy reactivity surviving the mount() boundary.
	private currentContext: GoogleMapMarkerContext = {
		zoom: 0,
		highlightedId: null,
		selectedId: null
	};
	private highlightedId: GoogleMapMarkerId | null = null;
	private selectedId: GoogleMapMarkerId | null = null;
	private markerClusterer: DetachableMarkerClusterer | undefined;
	private activeCluster: boolean | GoogleMapClusterOptions | undefined;
	private activeFitBounds: boolean | GoogleMapFitBoundsOptions | undefined;
	private hasFittedOnce = false;
	private currentMarkerClickHandler: GoogleMapProps<Item>['onMarkerClick'];
	private currentMarkerContent: GoogleMapProps<Item>['markerContent'];
	private fitBoundsListener: MapsEventListener | undefined;
	private viewportListener: MapsEventListener | undefined;
	private clusteringEndListener: MapsEventListener | undefined;
	// Target of the in-progress camera drive. Held until the marker is centered, then
	// cleared so a manual pan afterward isn't yanked back. Re-read on every clusteringend,
	// so a fresh hover mid-drill simply retargets the drive.
	private focusDriveId: GoogleMapMarkerId | null = null;

	constructor(
		private readonly map: GoogleMapInstance,
		private readonly libraries: GoogleMapsLibraries
	) {
		this.updateContext();
		// Re-evaluate which markers are on screen (and the zoom tier) after every
		// pan/zoom. 'idle' fires once movement settles, so this is not per-frame.
		this.viewportListener = this.map.addListener('idle', this.handleViewportIdle);
	}

	setView(center: GoogleMapCenter, zoom: number) {
		this.map.setCenter(center);
		this.map.setZoom(zoom);
	}

	/**
	 * Rebuild the shared context snapshot and push it to every mounted portal. The new
	 * object reference is what guarantees the re-render — the same reliable channel as
	 * an item update, so highlight/zoom changes always reach already-mounted markers.
	 */
	private updateContext() {
		this.currentContext = {
			zoom: this.map.getZoom() ?? 0,
			highlightedId: this.highlightedId,
			selectedId: this.selectedId
		};
		for (const record of this.markerRecords.values()) {
			if (record.portal) record.portal.props.context = this.currentContext;
		}
	}

	/**
	 * Highlight a hovered item (via the shared context, so the real marker itself renders
	 * as selected) and drive the camera to it: a clustered marker is drilled into (zoom in
	 * until its cluster splits) until it stands alone, then centered.
	 */
	focusOn(id: GoogleMapMarkerId | null) {
		if (this.highlightedId !== id) {
			this.highlightedId = id;
			this.updateContext();
		}

		// Hover-out (id null): stop driving but leave the camera where it landed; snapping
		// back on every mouse-out is disorienting. Hover-in: drive the camera to the marker.
		this.focusDriveId = id;
		if (id !== null) this.driveCameraToFocus();
	}

	/**
	 * Move the camera to the focused marker. If it's hidden inside a cluster, center on it
	 * and zoom in a notch — handleClusteringEnd re-drives after the clusterer re-renders,
	 * so the zoom keeps stepping until the cluster splits and the marker stands alone, then
	 * a final pan glides it to the center. Capped at FOCUS_MAX_ZOOM so points that never
	 * separate (near-identical coordinates) can't loop forever.
	 */
	private driveCameraToFocus() {
		const id = this.focusDriveId;
		if (id === null) return;

		const record = this.markerRecords.get(id);
		if (!record) {
			this.focusDriveId = null;
			return;
		}

		const position = { lat: record.lat, lng: record.lng };
		const zoom = this.map.getZoom() ?? 0;
		// marker.map === map means the clusterer is painting this marker standalone (or
		// there's no clusterer); otherwise it's still swallowed by a cluster glyph.
		const clustered = Boolean(this.markerClusterer) && record.marker.map !== this.map;

		if (clustered && zoom < FOCUS_MAX_ZOOM) {
			this.map.setCenter(position);
			this.map.setZoom(Math.min(zoom + FOCUS_ZOOM_STEP, FOCUS_MAX_ZOOM));
			return; // keep focusDriveId set; handleClusteringEnd resumes the drill
		}

		this.map.panTo(position);
		this.focusDriveId = null;
	}

	/** Mark a clicked/active item as selected (persistent highlight, no camera move). */
	setSelected(id: GoogleMapMarkerId | null) {
		if (this.selectedId === id) return;
		this.selectedId = id;
		this.updateContext();
	}

	sync({
		markers,
		cluster,
		fitBounds,
		onMarkerClick,
		markerContent
	}: GoogleMapControllerSyncOptions<Item>) {
		this.currentMarkerClickHandler = onMarkerClick;
		this.currentMarkerContent = markerContent;
		const clusterChanged = this.syncClusterer(cluster);
		const geometryChanged = this.reconcileMarkers(markers);
		const fitBoundsChanged = this.activeFitBounds !== fitBounds;
		this.activeFitBounds = fitBounds;

		if (fitBounds) {
			const fitOnce = typeof fitBounds === 'object' && fitBounds.once === true;
			// With infinite loading, fit only the first time markers exist, then leave the
			// viewport alone so later pages don't yank the map around.
			const shouldFit =
				!(fitOnce && this.hasFittedOnce) && (geometryChanged || clusterChanged || fitBoundsChanged);
			if (shouldFit) {
				this.fitMapToMarkers(fitBounds);
				if (fitOnce && this.markerRecords.size > 0) this.hasFittedOnce = true;
			}
		} else {
			this.fitBoundsListener?.remove();
			this.fitBoundsListener = undefined;
		}

		this.refreshVisibleContent();
	}

	destroy() {
		this.viewportListener?.remove();
		this.viewportListener = undefined;
		this.fitBoundsListener?.remove();
		this.fitBoundsListener = undefined;
		this.destroyClusterer();
		this.focusDriveId = null;

		for (const record of this.markerRecords.values()) {
			this.removeMarkerClickHandler(record);
			this.unmountMarkerContent(record);
			record.marker.map = null;
		}
		this.markerRecords.clear();
		this.activeCluster = undefined;
		this.activeFitBounds = undefined;
		this.hasFittedOnce = false;
	}

	private removeMarkerClickHandler(record: MarkerRecord<Item>) {
		if (!record.clickHandler) return;
		record.marker.removeEventListener('gmp-click', record.clickHandler);
		record.clickHandler = undefined;
	}

	private syncMarkerClickHandler(record: MarkerRecord<Item>) {
		const isClickable = Boolean(this.currentMarkerClickHandler);
		record.marker.gmpClickable = isClickable;

		if (!isClickable) {
			this.removeMarkerClickHandler(record);
			return;
		}

		if (record.clickHandler) return;

		record.clickHandler = () => this.currentMarkerClickHandler?.(record.item);
		record.marker.addEventListener('gmp-click', record.clickHandler);
	}

	private handleViewportIdle = () => {
		// When clustering, the clusterer decides which markers are on the map; we
		// wait for its 'clusteringend' before touching content to avoid stale reads.
		if (!this.markerClusterer) this.refreshVisibleContent();
		this.updateContext(); // fan the new zoom tier out to mounted portals
	};

	private handleClusteringEnd = () => {
		this.refreshVisibleContent();
		this.updateContext();
		// The cluster layout just changed (e.g. a focus zoom-in split a cluster); continue
		// driving the camera toward the focused marker if a drill is still in progress.
		if (this.focusDriveId !== null) this.driveCameraToFocus();
	};

	/**
	 * Viewport virtualization: mount custom content only for markers that are
	 * actually painted (on the map, i.e. not clustered away) and inside the current
	 * bounds. This caps mounted Svelte components to what's on screen instead of the
	 * full dataset, which is what keeps thousands of markers smooth.
	 */
	private refreshVisibleContent() {
		const bounds = this.map.getBounds();
		// No content snippet, or no bounds yet (pre-first-idle): nothing to mount.
		if (!this.currentMarkerContent || !bounds) return;

		for (const record of this.markerRecords.values()) {
			const onMap = record.marker.map === this.map;
			const inView = bounds.contains({ lat: record.lat, lng: record.lng });
			this.setMarkerContentVisible(record, onMap && inView);
		}
	}

	private setMarkerContentVisible(record: MarkerRecord<Item>, visible: boolean) {
		if (visible && this.currentMarkerContent) {
			if (record.portal) {
				record.portal.props.content = this.currentMarkerContent;
				record.portal.props.item = record.item;
				record.portal.props.context = this.currentContext;
			} else {
				record.portal = this.mountMarkerContent(record.marker, record.item);
			}
			return;
		}

		this.unmountMarkerContent(record);
	}

	private mountMarkerContent(
		marker: GoogleMapAdvancedMarker,
		item: Item
	): MarkerPortalHandle<Item> | undefined {
		const content = this.currentMarkerContent;
		if (!content) return undefined;

		const target = document.createElement('div');
		// $state makes the props object reactive so the item and shared marker context
		// can update in place; the portal re-renders without being remounted.
		const props = $state<MarkerPortalProps<Item>>({ content, item, context: this.currentContext });
		const app = mount(MarkerPortal as unknown as Component<MarkerPortalProps<Item>>, {
			target,
			props
		});

		marker.content = target;
		return { app, props };
	}

	private unmountMarkerContent(record: MarkerRecord<Item>) {
		if (!record.portal) return;
		void unmount(record.portal.app);
		record.portal = undefined;
		// Drop the detached DOM and fall back to the default pin if it ever repaints.
		record.marker.content = null;
	}

	private destroyClusterer() {
		if (!this.markerClusterer) return;
		this.clusteringEndListener?.remove();
		this.clusteringEndListener = undefined;
		this.markerClusterer.clearMarkers(true);
		this.markerClusterer.setMap(null);
		this.markerClusterer = undefined;
	}

	private syncClusterer(clusterSetting: boolean | GoogleMapClusterOptions) {
		if (this.activeCluster === clusterSetting) return false;

		this.destroyClusterer();
		for (const { marker } of this.markerRecords.values()) marker.map = null;

		if (clusterSetting) {
			const clusterOptions: GoogleMapClusterOptions = clusterSetting === true ? {} : clusterSetting;
			const { algorithm, algorithmOptions, ...remainingClusterOptions } = clusterOptions;
			this.markerClusterer = new MarkerClusterer({
				...remainingClusterOptions,
				algorithm: algorithm ?? new SuperClusterAlgorithm(algorithmOptions ?? {}),
				map: this.map,
				markers: Array.from(this.markerRecords.values(), ({ marker }) => marker)
			}) as DetachableMarkerClusterer;
			this.clusteringEndListener = this.markerClusterer.addListener(
				'clusteringend',
				this.handleClusteringEnd
			);
		} else {
			for (const { marker } of this.markerRecords.values()) marker.map = this.map;
		}

		this.activeCluster = clusterSetting;
		return true;
	}

	private reconcileMarkers(markerItems: readonly Item[]) {
		// A short-lived native Set avoids reactive collection overhead during reconciliation.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const seenIds = new Set<GoogleMapMarkerId>();
		const addedMarkers: GoogleMapAdvancedMarker[] = [];
		const removedMarkers: GoogleMapAdvancedMarker[] = [];
		let geometryChanged = false;

		for (const item of markerItems) {
			if (!Number.isFinite(item.lat) || !Number.isFinite(item.lng)) continue;

			seenIds.add(item.id);
			const existing = this.markerRecords.get(item.id);

			if (existing) {
				existing.item = item;

				if (existing.lat !== item.lat || existing.lng !== item.lng) {
					existing.marker.position = { lat: item.lat, lng: item.lng };
					existing.lat = item.lat;
					existing.lng = item.lng;
					geometryChanged = true;
				}

				const title = item.title ?? '';
				if (existing.marker.title !== title) existing.marker.title = title;
				// Keep already-mounted (on-screen) content in sync with fresh data.
				if (existing.portal) existing.portal.props.item = item;
				this.syncMarkerClickHandler(existing);
				continue;
			}

			const marker = new this.libraries.marker.AdvancedMarkerElement({
				map: this.markerClusterer ? null : this.map,
				position: { lat: item.lat, lng: item.lng },
				title: item.title ?? '',
				gmpClickable: Boolean(this.currentMarkerClickHandler)
			});
			const record: MarkerRecord<Item> = { marker, item, lat: item.lat, lng: item.lng };

			// Content is mounted lazily by refreshVisibleContent() once we know the
			// marker is on screen — never eagerly for the whole dataset.
			this.markerRecords.set(item.id, record);
			this.syncMarkerClickHandler(record);
			addedMarkers.push(marker);
			geometryChanged = true;
		}

		for (const [id, record] of this.markerRecords) {
			if (seenIds.has(id)) continue;

			this.removeMarkerClickHandler(record);
			this.unmountMarkerContent(record);
			record.marker.map = null;
			this.markerRecords.delete(id);
			removedMarkers.push(record.marker);
			geometryChanged = true;
		}

		if (this.markerClusterer) {
			if (removedMarkers.length > 0) this.markerClusterer.removeMarkers(removedMarkers, true);
			if (addedMarkers.length > 0) this.markerClusterer.addMarkers(addedMarkers, true);
			if (geometryChanged) this.markerClusterer.render();
		}

		return geometryChanged;
	}

	private fitMapToMarkers(fitBoundsSetting: true | GoogleMapFitBoundsOptions) {
		this.fitBoundsListener?.remove();
		this.fitBoundsListener = undefined;
		if (this.markerRecords.size === 0) return;

		const bounds = new this.libraries.core.LatLngBounds();
		for (const { lat, lng } of this.markerRecords.values()) bounds.extend({ lat, lng });

		const fitOptions = fitBoundsSetting === true ? {} : fitBoundsSetting;
		this.map.fitBounds(bounds, fitOptions.padding);

		const { maxZoom } = fitOptions;
		if (maxZoom === undefined) return;

		const listener = this.map.addListener('idle', () => {
			const fittedZoom = this.map.getZoom();
			if (fittedZoom !== undefined && fittedZoom > maxZoom) this.map.setZoom(maxZoom);
			listener.remove();
			if (this.fitBoundsListener === listener) this.fitBoundsListener = undefined;
		});
		this.fitBoundsListener = listener;
	}
}
