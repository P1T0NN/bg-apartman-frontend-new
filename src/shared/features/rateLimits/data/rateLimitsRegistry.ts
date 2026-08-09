// Rate-limit bucket DATA — names, presets, per-function assignments. Dual-runtime (the
// Convex limiter enforces these; trusted SvelteKit server routes reference the names), so
// this file stays dependency-free. Enforcement lives in `src/convex/rateLimits/` and
// `convexRateLimiter.ts`; the name union is derived in `../types/rateLimitsTypes.ts`.

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/**
 * Reusable token-bucket shapes. Pick a preset when registering a function, or
 * define custom values inline in {@link convexRateLimitRegistry}.
 *
 * - `rate` = sustained refill (tokens per `period`)
 * - `capacity` = max burst before throttling
 */
export const limitPresets = {
	/** Fast interactive writes — form autosaves, click bursts, batch ops. 2/s sustained, burst 60. */
	interactiveWrite: {
		kind: 'token bucket' as const,
		rate: 120,
		period: MINUTE,
		capacity: 60
	},
	/** External / long-running actions. 1/s sustained, burst 20. */
	externalAction: {
		kind: 'token bucket' as const,
		rate: 60,
		period: MINUTE,
		capacity: 20
	},
	/** Bulk deletes — weighted by `ids.length` at call time. 200/min sustained, burst 100. */
	bulkDelete: {
		kind: 'token bucket' as const,
		rate: 200,
		period: MINUTE,
		capacity: 100
	},
	/** File uploads — mints storage URL + row insert. 30/min sustained, burst 10. */
	fileUpload: {
		kind: 'token bucket' as const,
		rate: 30,
		period: MINUTE,
		capacity: 10
	},
	/** Expensive read endpoints (search). Advisory in queries unless charged by a trusted remote. 60/min sustained, burst 30. */
	searchQuery: {
		kind: 'token bucket' as const,
		rate: 60,
		period: MINUTE,
		capacity: 30
	},
	/**
	 * PUBLIC, UNAUTHENTICATED writes (booking request, report, newsletter, contact form).
	 *
	 * Every other bucket here is charged per signed-in user or, for the auth routes, per IP
	 * by the Better Auth hook. These four have no session to key on, so they key on the
	 * submitted email — the only stable identity the payload carries — and are deliberately
	 * hourly, not per-minute: a human fills one of these forms a handful of times a day.
	 *
	 * Burst 6 rather than 2–3 because a guest shopping around genuinely fires several booking
	 * requests in one sitting; the sustained 10/h is what a loop runs into.
	 */
	publicWrite: {
		kind: 'token bucket' as const,
		rate: 10,
		period: HOUR,
		capacity: 6
	},
	/**
	 * Platform-wide floor for the one public write that costs money and attention (a booking
	 * request mails the host and lands in their queue). An attacker rotating email addresses
	 * slips past {@link publicWrite} entirely — this is the bucket they still hit. Sized so a
	 * genuinely busy day never touches it: 120 straight through, then 10/min sustained.
	 */
	publicWriteFloor: {
		kind: 'token bucket' as const,
		rate: 600,
		period: HOUR,
		capacity: 120
	},
	/** Better Auth — credential sign-in. 5/min per IP. */
	authSignIn: {
		kind: 'token bucket' as const,
		rate: 5,
		period: MINUTE,
		capacity: 5
	},
	/** Better Auth — sign-up. 3/min per IP. */
	authSignUp: {
		kind: 'token bucket' as const,
		rate: 3,
		period: MINUTE,
		capacity: 3
	},
	/** Better Auth — OTP send (email cost). 2/min per IP or email. */
	authOtpSend: {
		kind: 'token bucket' as const,
		rate: 2,
		period: MINUTE,
		capacity: 2
	},
	/** Better Auth — OTP verify. 5/min per IP or email. */
	authOtpVerify: {
		kind: 'token bucket' as const,
		rate: 5,
		period: MINUTE,
		capacity: 5
	},
	/** Better Auth — password reset request. 3/min per IP or email. */
	authPasswordResetRequest: {
		kind: 'token bucket' as const,
		rate: 3,
		period: MINUTE,
		capacity: 3
	},
	/** Better Auth — password reset submit. 5/min per IP or email. */
	authPasswordReset: {
		kind: 'token bucket' as const,
		rate: 5,
		period: MINUTE,
		capacity: 5
	},
	/** Better Auth — OAuth start. 10/min per IP. */
	authOAuth: {
		kind: 'token bucket' as const,
		rate: 10,
		period: MINUTE,
		capacity: 10
	}
} as const;

/**
 * Per-function and trusted server-route rate limits.
 *
 * When adding a protected endpoint:
 * 1. Add an entry here (preset or custom).
 * 2. Pass the same name to `authMutation` / `adminMutation` / `createDeleteMutation` /
 *    `fetchOptimized`, use it in a trusted remote search source, or add a route mapping in
 *    {@link AUTH_ROUTE_LIMITS} for Better Auth.
 */
export const convexRateLimitRegistry = {
	// Admin user management
	setUserRole: limitPresets.interactiveWrite,
	setUserSuperhost: limitPresets.interactiveWrite,
	banUser: limitPresets.interactiveWrite,
	unbanUser: limitPresets.interactiveWrite,
	revokeSession: limitPresets.interactiveWrite,
	revokeAllSessions: limitPresets.interactiveWrite,
	deleteUser: limitPresets.bulkDelete,

	// Accommodations
	createApartment: limitPresets.interactiveWrite,
	createApartmentAdmin: limitPresets.interactiveWrite,
	updateApartment: limitPresets.interactiveWrite,
	setApartmentStatus: limitPresets.interactiveWrite,
	switchListingMonetization: limitPresets.interactiveWrite,
	moderateApartmentStatus: limitPresets.interactiveWrite,
	setApartmentFeatured: limitPresets.interactiveWrite,
	stampListingFeePayment: limitPresets.interactiveWrite,
	deleteApartment: limitPresets.bulkDelete,
	blockApartmentDates: limitPresets.interactiveWrite,
	unblockApartmentDates: limitPresets.interactiveWrite,
	requestStayConfirmation: limitPresets.interactiveWrite,

	// Convex storage uploads
	generateConvexUploadUrl: limitPresets.fileUpload,
	saveUploadedFile: limitPresets.fileUpload,

	// R2 uploads
	generateR2UploadUrl: limitPresets.fileUpload,

	// Bulk deletes
	deleteUploadedFile: limitPresets.bulkDelete,
	deleteUploadedFileR2: limitPresets.bulkDelete,

	// Favorites
	toggleFavorite: limitPresets.interactiveWrite,
	mergeFavorites: limitPresets.interactiveWrite,

	// Bookings
	confirmBooking: limitPresets.interactiveWrite,
	declineBooking: limitPresets.interactiveWrite,
	cancelBookingOwner: limitPresets.interactiveWrite,
	cancelBookingAdmin: limitPresets.interactiveWrite,
	clearPaymentFlag: limitPresets.interactiveWrite,
	cancelBookingGuest: limitPresets.interactiveWrite,
	withdrawBookingGuest: limitPresets.interactiveWrite,
	/** Reservation-link recovery, keyed by the submitted email — tight, it guards a guessable code. */
	findMyReservation: {
		kind: 'token bucket' as const,
		rate: 10,
		period: MINUTE,
		capacity: 5
	},

	// Public, unauthenticated writes — see `limitPresets.publicWrite` for the keying rule.
	/** Keyed by guest email. */
	createBooking: limitPresets.publicWrite,
	/** One global bucket — the floor an attacker rotating emails still hits. */
	createBookingFloor: limitPresets.publicWriteFloor,
	/** Keyed by reporter email, or one shared `anon` bucket when they left it blank. */
	createReport: limitPresets.publicWrite,
	/** Keyed by the submitted email. */
	subscribeToNewsletter: limitPresets.publicWrite,
	/** Keyed by client IP — the contact form is a SvelteKit remote, so it has one. */
	contactForm: limitPresets.publicWrite,

	// Reports
	setReportStatus: limitPresets.interactiveWrite,

	// Search / expensive reads
	publicSearchInput: limitPresets.searchQuery,

	// Better Auth HTTP routes (enforced in hooks.before — see auth/authRoutes.ts)
	signInEmail: limitPresets.authSignIn,
	signUpEmail: limitPresets.authSignUp,
	sendVerificationOtp: limitPresets.authOtpSend,
	sendVerificationOtpByEmail: limitPresets.authOtpSend,
	verifyEmailOtp: limitPresets.authOtpVerify,
	verifyEmailOtpByEmail: limitPresets.authOtpVerify,
	requestPasswordReset: limitPresets.authPasswordResetRequest,
	requestPasswordResetByEmail: limitPresets.authPasswordResetRequest,
	resetPassword: limitPresets.authPasswordReset,
	resetPasswordByEmail: limitPresets.authPasswordReset,
	signInSocial: limitPresets.authOAuth
} as const;
