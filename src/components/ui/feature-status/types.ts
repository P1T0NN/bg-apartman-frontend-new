/**
 * Presentation contract for any domain's status pills — bookings, payments, listings, and
 * whatever comes next. One component (`feature-status.svelte`) renders them all; each
 * feature owns only its status → tone map.
 */

/** How one status looks. */
export type typesStatusTone = {
	label: string;
	/** Pill classes (ring style). */
	badgeClass: string;
	/** Solid dot used in the compact variant and in legends. */
	dotClass: string;
};

/**
 * A feature's complete status → tone map. `Record` keyed by the status union makes it
 * exhaustive: a new status fails to compile until it is given a presentation.
 */
export type typesStatusConfig<TStatus extends string> = Record<TStatus, typesStatusTone>;

/** Optional "?" link to a page explaining what the statuses mean. */
export type typesFeatureStatusHelp = {
	href: string;
	/** Accessible name for the link — say what the reader will learn. */
	ariaLabel: string;
	/** Tooltip copy; defaults to "Click to learn more". */
	tooltip?: string;
};

export type typesFeatureStatusProps<TStatus extends string> = {
	config: typesStatusConfig<TStatus>;
	status: TStatus;
	/** `badge` = ring pill (default), `dot` = coloured dot + label (legends / dense rows). */
	variant?: 'badge' | 'dot';
	help?: typesFeatureStatusHelp;
	class?: string;
};
