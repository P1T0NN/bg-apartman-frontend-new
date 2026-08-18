/**
 * Closed registry of audit action keys.
 *
 * Add new actions here — `as const` keeps the union narrow so typos at call
 * sites become compile errors and downstream filters (admin UI, retention
 * rules) can exhaustively switch over the values.
 *
 * Convention: `domain.entity.verb` (lowercase, dotted). Keep stable — these
 * strings live in the database and any rename is a data migration.
 *
 * When adding an action, consider whether the 90-day default retention fits;
 * override it in {@link AUDIT_RETENTION_DAYS} below if not.
 */
export const AUDIT_ACTIONS = {
	// Auth / users
	USER_UPDATE: 'user.update',
	USER_DELETE: 'user.delete',
	USER_ROLE_UPDATE: 'user.role.update',
	USER_SUPERHOST_UPDATE: 'user.superhost.update',
	USER_BAN: 'user.ban',
	USER_UNBAN: 'user.unban',
	USER_SESSION_REVOKE: 'user.session.revoke',
	USER_SESSIONS_REVOKE_ALL: 'user.sessions.revoke_all',

	// Generic admin
	ADMIN_ACTION: 'admin.action',

	// Moderation
	APARTMENT_MODERATE: 'apartment.moderate',
	APARTMENT_FEATURE: 'apartment.feature',
	BOOKING_ADMIN_CANCEL: 'booking.admin_cancel',
	BOOKING_PAYMENT_FLAG_CLEAR: 'booking.payment_flag.clear',

	// Money recorded by a human — the audit entry IS the trail (AccommodationsSystemDesign.md §8).
	APARTMENT_FEE_STAMP: 'apartment.fee.stamp',
	APARTMENT_FEE_REFUND: 'apartment.fee.refund',
	// Free publish grants: paid coverage with no payment — even less money trail, so it audits.
	APARTMENT_FREE_PUBLISH: 'apartment.fee.free_publish',
	// The one-way listing_fee → booking_fee switch (ASD §8) — irreversible, so it leaves a trail.
	APARTMENT_MONETIZATION_SWITCH: 'apartment.monetization.switch',

	// Files
	FILE_UPLOAD: 'file.upload',
	FILE_DELETE: 'file.delete'
} as const;

/**
 * Per-action retention in days. Anything not listed falls back to
 * `AUDIT_RETENTION_DEFAULT_DAYS`. Set to `Infinity` to keep forever.
 *
 * Tune per project: noisy actions short, security-critical actions long.
 */
export const AUDIT_RETENTION_DEFAULT_DAYS = 90;

export const AUDIT_RETENTION_DAYS: Partial<Record<AuditAction, number>> = {
	'user.role.update': 365 * 5,
	'user.delete': 365 * 5,
	'user.ban': 365 * 5,
	'user.unban': 365 * 5,
	'user.session.revoke': 365 * 5,
	'user.sessions.revoke_all': 365 * 5,
	'apartment.moderate': 365 * 5,
	'booking.admin_cancel': 365 * 5,
	// Money-adjacent evidence: the clear entry proves a failed payment op was finished by
	// a human, and the stamp grants paid time with no money trail of its own — keep both
	// as long as the financial records they stand in for.
	'booking.payment_flag.clear': 365 * 5,
	'apartment.fee.stamp': 365 * 5,
	'apartment.fee.free_publish': 365 * 5,
	'apartment.fee.refund': 365 * 5
};

/**
 * Hand-written call sites should use {@link AUDIT_ACTIONS} members and get
 * autocomplete; factory-generated keys (e.g. `createDeleteMutation`'s default
 * `${table}.delete`) are accepted as raw strings via the `(string & {})` trick
 * — TS keeps the literal union for autocomplete while still accepting any string.
 */
export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS] | (string & {});
