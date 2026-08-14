// LIBRARIES
import { env } from '$env/dynamic/public';
import { m } from '@/paraglide/messages';

/**
 * Shared loader for the **Google Maps JS API**. Injects the official bootstrap
 * script exactly once, then resolves individual libraries via `importLibrary`.
 *
 * Both the Places autocomplete (`places.ts`) and the map display (`maps.ts`)
 * go through here so the script is only ever added to the page a single time.
 *
 * Setup required:
 *  1. Enable **"Maps JavaScript API"** and **"Places API (New)"** in Google Cloud.
 *  2. Create a browser API key (restrict by HTTP referrer) and put it in
 *     `.env.local` as `PUBLIC_GOOGLE_MAPS_API_KEY`.
 *  3. Allow `maps.googleapis.com` in the CSP (see `svelte.config.js`).
 */

declare global {
	interface Window {
		google?: typeof google;
		__onGoogleMapsReady?: () => void;
		/** Google calls this if the API key is rejected (invalid key, referrer, billing). */
		gm_authFailure?: () => void;
	}
}

let scriptPromise: Promise<void> | null = null;

/**
 * Import a Maps JS library (e.g. `'places'`, `'maps'`, `'marker'`), loading the
 * bootstrap script first if needed. The caller supplies the expected shape `T`.
 */
export async function importGoogleLibrary<T>(name: string): Promise<T> {
	if (typeof window === 'undefined') {
		throw new Error(m['loader.browserOnly']());
	}

	const apiKey = env.PUBLIC_GOOGLE_MAPS_API_KEY;
	if (!apiKey) {
		throw new Error(m['loader.mapsUnavailable']());
	}

	const w = window;
	if (!w.google?.maps?.importLibrary) {
		if (!scriptPromise) {
			scriptPromise = injectMapsScript(w, apiKey);
			// Allow a retry if the network/script load failed.
			scriptPromise.catch(() => {
				scriptPromise = null;
			});
		}
		await scriptPromise;
	}

	return w.google!.maps.importLibrary(name) as Promise<T>;
}

function injectMapsScript(w: Window, apiKey: string): Promise<void> {
	return new Promise((resolve, reject) => {
		w.__onGoogleMapsReady = () => resolve();

		// Surfaced when Google rejects the key — otherwise this fails silently.
		w.gm_authFailure = () =>
			console.error(
				"[google-maps] Google rejected the API key. Check that: the key is correct, this origin is in the key's HTTP-referrer allowlist, the required APIs are enabled, and billing is active."
			);

		// `language: 'en'` is the address-script invariant's master switch (TODO.md §2 layer 1):
		// without it, a `sr-Cyrl` browser locale makes Google return Cyrillic street/city names.
		// 'en' matches the app's English UI — 'sr' would return the same Latin names ("Knez
		// Mihailova") once the app localizes; either is safe, a Cyrillic locale never is.
		const params = new URLSearchParams({
			key: apiKey,
			v: 'weekly',
			loading: 'async',
			language: 'en',
			callback: '__onGoogleMapsReady'
		});

		const script = document.createElement('script');
		script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
		script.async = true;
		script.onerror = () => reject(new Error(m['loader.loadFailed']()));
		document.head.append(script);
	});
}
