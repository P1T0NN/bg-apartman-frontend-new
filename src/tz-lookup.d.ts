// `tz-lookup` ships no types. It exports a single function mapping a coordinate to
// its IANA timezone name. Used (dynamically imported) to resolve a accommodation's zone
// from its address pin — see `shared/lib/google-maps/places.ts`.
declare module 'tz-lookup' {
	/** IANA timezone name for a coordinate (e.g. `'Europe/Belgrade'`). Throws on invalid lat/lon. */
	export default function tzlookup(lat: number, lon: number): string;
}
