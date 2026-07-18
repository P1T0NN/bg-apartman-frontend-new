export const PAGINATION_DATA = {
	DEFAULT_PAGE_SIZE: 10,
	/** Server-side cap for `paginationOpts.numItems` (e.g. search dropdowns). */
	MAX_PAGE_SIZE: 25,
	/** Page size for infinite scroll. */
	INFINITE_SCROLL_PAGE_SIZE: 12,
	/** Default for `DataTable` `optimizationStrategy` (see `DataTableOptimizationStrategy` in data-table `types.ts`). */
	DEFAULT_OPTIMIZATION_STRATEGY: 'cursor' as const
};

export const COOKIE_NAMES = {
	SESSION_TOKEN: 'session_token',
	DEVICE_FINGERPRINT: 'device_fingerprint'
} as const;

export const LOCAL_STORAGE_KEYS = {
	GUEST_FAVORITES: 'bg-apartman:guest-favorites'
} as const;

/**
 * Routes instrumented by `initBotId` on the client and verified by
 * `checkBotId` on the server via `safeCommand`.
 *
 * SvelteKit remote functions POST to `/_app/remote/<hash>/call`. With locale
 * prefixes (Paraglide), the path becomes `/<locale>/_app/remote/<hash>/call`.
 */
export const BOTID_PROTECTED_ROUTES = [
	{ path: '/_app/remote/*', method: 'POST' as const },
	{ path: '/*/_app/remote/*', method: 'POST' as const }
];

/**
 * Runtime feature flags. Toggle subsystems on/off in one place.
 * Evaluated in Convex functions and on the client.
 */
export const FEATURES = {
	/**
	 * Enable audit logging. When `false`, `ctx.audit()` / `logAudit()` are no-ops
	 * and nothing is written to the `auditLogs` table.
	 *
	 * The table itself is always declared in the schema so toggling this flag
	 * does not require a schema migration.
	 */
	AUDIT_LOGS: true,

	/**
	 * Use Cloudflare R2 (`@convex-dev/r2`) for file uploads instead of Convex storage.
	 * - `true`  → uploads go to R2, reads/deletes target the `uploadedFilesR2` table.
	 * - `false` → uploads go to Convex storage, reads/deletes target `uploadedFiles`.
	 * Both backends stay registered server-side; this only switches which one the UI uses.
	 */
	USE_R2: true
} as const;

/**
 * Cross-cutting business settings shared by the frontend and Convex.
 */
export const PROJECT_SETTINGS = {
	/**
	 * Booking statuses that count as money (revenue/GMV/occupancy aggregations) —
	 * real stays only, never pending/declined/cancelled.
	 */
	BOOKING_EARNING_STATUSES: ['confirmed', 'checked_in', 'checked_out']
} as const;

/**
 * Fallback IANA zone for a accommodation's availability calendar — used only when a accommodation
 * has no stored `timeZone` (rows created before timezone resolution existed, or a
 * failed lookup). Each accommodation now resolves its own zone from the address pin
 * (coordinates → IANA via `tz-lookup`; see `PlaceDetails.timeZone`), so the calendar
 * runs in the apartment's local day, not the viewer's. Belgrade because the accommodations
 * to date are Serbian.
 */
export const DEFAULT_TIME_ZONE = 'Europe/Belgrade';
