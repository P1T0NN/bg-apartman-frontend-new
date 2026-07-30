// TYPES
import type { Snippet } from 'svelte';
import type { MarkerClustererOptions, SuperClusterOptions } from '@googlemaps/markerclusterer';
import type { LibraryMap } from '@googlemaps/js-api-loader';

type MapsLibrary = LibraryMap['maps'];
type MarkerLibrary = LibraryMap['marker'];

export type GoogleMapInstance = InstanceType<MapsLibrary['Map']>;
export type GoogleMapOptions = NonNullable<ConstructorParameters<MapsLibrary['Map']>[1]>;
export type GoogleMapCenter = NonNullable<GoogleMapOptions['center']>;
export type GoogleMapAdvancedMarker = InstanceType<MarkerLibrary['AdvancedMarkerElement']>;
export type GoogleMapFitBoundsPadding = NonNullable<Parameters<GoogleMapInstance['fitBounds']>[1]>;

export type GoogleMapsLibraries = {
	maps: LibraryMap['maps'];
	marker: LibraryMap['marker'];
	core: LibraryMap['core'];
};

export type GoogleMapMarkerId = string | number;

export type GoogleMapMarkerData = {
	id: GoogleMapMarkerId;
	lat: number;
	lng: number;
	title?: string;
};

export type GoogleMapMarkerContext = {
	/** Current map zoom level — use it to swap marker detail by zoom (two-tier rendering). */
	zoom: number;
	/** Marker ID currently highlighted by an external interaction, such as card hover. */
	highlightedId: GoogleMapMarkerId | null;
	/** Marker ID currently selected by an external interaction. */
	selectedId: GoogleMapMarkerId | null;
};

export type GoogleMapClusterOptions = Omit<
	MarkerClustererOptions,
	'map' | 'markers' | 'algorithmOptions'
> & {
	/**
	 * Options for the default SuperCluster algorithm — e.g. `radius` (bigger =
	 * more aggressive clustering), `maxZoom`, `minPoints`.
	 */
	algorithmOptions?: SuperClusterOptions;
};

export type GoogleMapFitBoundsOptions = {
	padding?: GoogleMapFitBoundsPadding;
	/** Caps the zoom after fitting, which is especially useful for a single marker. */
	maxZoom?: number;
	/**
	 * Fit only the first time markers appear, then leave the viewport alone. Use
	 * this with incremental/infinite loading so the map doesn't jump on every page.
	 */
	once?: boolean;
};

export type GoogleMapHandle = {
	/** Highlight a marker and move the camera to it, drilling into its cluster first if needed. */
	setFocus(id: GoogleMapMarkerId | null): void;
	/** Persistently highlight a marker ID. */
	setSelected(id: GoogleMapMarkerId | null): void;
};

export type GoogleMapProps<Item extends GoogleMapMarkerData> = {
	/** Map center. Defaults to Zagreb. */
	center?: GoogleMapCenter;
	/** Initial zoom level. */
	zoom?: number;
	/** Extra options forwarded to the Google map instance. */
	options?: GoogleMapOptions;
	/** Marker data. IDs must be unique and stable across updates. */
	markers?: readonly Item[];
	/** Enable clustering, optionally with custom MarkerClusterer options. */
	cluster?: boolean | GoogleMapClusterOptions;
	/** Automatically frame markers after their coordinates or this option change. */
	fitBounds?: boolean | GoogleMapFitBoundsOptions;
	/** Called with the latest data item for the clicked marker ID. */
	onMarkerClick?: (item: Item) => void;
	/**
	 * Per-marker content. Receives the data item and a reactive context (current
	 * zoom and interaction IDs) and renders the marker's visual (e.g. a price tag).
	 * Content is mounted only for markers currently visible on screen. When omitted,
	 * the default Google pin is used.
	 */
	markerContent?: Snippet<[Item, GoogleMapMarkerContext]>;
	/**
	 * Content rendered as an overlay inside the map container (a positioned context),
	 * e.g. a detail panel docked to the bottom. Position it yourself with `absolute`
	 * classes; only the area it covers intercepts pointer events.
	 */
	overlay?: Snippet;
	/** Classes for the map container (controls height/width). */
	class?: string;
};
