// LIBRARIES
import { importGoogleLibrary } from './loader';

/**
 * Thin wrapper for displaying a **read-only** Google map with a single marker.
 *
 * Uses the classic `google.maps.Marker` (rather than `AdvancedMarkerElement`)
 * so no Cloud "Map ID" is required — advanced markers silently fail to render
 * without one. Bootstrap script is loaded by `./loader` (shared with `places.ts`).
 * Types come from `@types/google.maps` (the ambient `google.maps` namespace).
 */

export type LatLng = google.maps.LatLngLiteral;
export type GoogleMap = google.maps.Map;
export type GoogleMarker = google.maps.Marker;

type MapConstructors = { Map: typeof google.maps.Map; Marker: typeof google.maps.Marker };

let promise: Promise<MapConstructors> | null = null;

/** Load the `Map` and `Marker` constructors (cached after the first call). */
export function loadMapLibrary(): Promise<MapConstructors> {
	if (promise) return promise;

	promise = (async () => {
		const [maps, marker] = await Promise.all([
			importGoogleLibrary<google.maps.MapsLibrary>('maps'),
			importGoogleLibrary<google.maps.MarkerLibrary>('marker')
		]);
		return { Map: maps.Map, Marker: marker.Marker };
	})();

	// Allow a retry if the load failed.
	promise.catch(() => {
		promise = null;
	});

	return promise;
}
