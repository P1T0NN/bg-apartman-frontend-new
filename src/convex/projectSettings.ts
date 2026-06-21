/**
 * Project-wide settings for the Convex backend.
 *
 * - `CONVEX_PROJECT_SETTINGS`: branding/contact strings used by emails, headers, etc.
 * - `FEATURES`: runtime feature flags. Toggle subsystems on/off in one place.
 *   Flags are evaluated at runtime in Convex functions and on the client.
 */
export const CONVEX_PROJECT_SETTINGS = {
	NAME: 'Company Name',
	RESEND_EMAIL: 'onboarding@resend.dev', // default email for the Resend provider
	EMAIL: 'company@gmail.com'
} as const;

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
