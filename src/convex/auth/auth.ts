// LIBRARIES
import { createClient, type AuthFunctions, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { components, internal } from '../_generated/api';
import type { DataModel } from '../_generated/dataModel';
import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal';
import { admin, emailOTP } from 'better-auth/plugins';
import authConfig from './auth.config';
import { sendVerificationOTP } from './emails/sendVerificationOTP';
import authSchema from './component/schema';
import { convexCreateAuthRateLimitHook } from './convexCreateAuthRateLimitHook';

// Explicit annotation on a standalone const — breaks the circular type inference
// between `authComponent`, the exported trigger mutations, and the generated api
// (see the better-auth triggers docs).
const authFunctions: AuthFunctions = internal.auth.auth;

export const authComponent = createClient<DataModel, typeof authSchema>(components.betterAuth, {
	local: {
		schema: authSchema
	},
	// Runs in app context (via the internal mutations exported below) whenever BA
	// creates a user row — covers email/password AND Google OAuth sign-ups.
	triggers: {
		session: {
			// Every sign-in (and the session BA mints after signup / OAuth) claims the user's
			// anonymous bookings — GuestSystemDesign.md §1. Scheduled, never awaited: the claim
			// must never block or fail auth, and the scheduled mutation is the aggregate-safe
			// write path (@/convex/functions). Idempotent, so re-running per login is a no-op.
			onCreate: async (ctx, session) => {
				await ctx.scheduler.runAfter(
					0,
					internal.tables.bookings.mutations.claimMyBookings.claimMyBookings,
					{ userId: session.userId }
				);
			}
		},
		// The `user` table lives inside the better-auth component, so the app's table triggers
		// can't follow it — these callbacks are how the dashboard's user count stays exact and
		// O(log n) instead of a capped `.take()` scan (`counters.users` in @/convex/functions).
		// Scheduled, never awaited: a counter write must never block or fail auth. Covers
		// email/password AND Google OAuth sign-ups (both create a user row through the adapter).
		user: {
			onCreate: async (ctx, user) => {
				await ctx.scheduler.runAfter(0, internal.functions.adjustUserCount, {
					id: user._id,
					delta: 1
				});
			},
			onDelete: async (ctx, user) => {
				await ctx.scheduler.runAfter(0, internal.functions.adjustUserCount, {
					id: user._id,
					delta: -1
				});
			}
		}
	},
	authFunctions
});

/** Trigger executors — BA's adapter calls these to run the callbacks above in app context. */
export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
	return {
		baseURL: process.env.SITE_URL,
		database: authComponent.adapter(ctx),
		user: {
			additionalFields: {
				role: {
					type: 'string',
					required: true,
					defaultValue: 'user',
					// Block clients from setting role via signUp/updateUser — only
					// trusted server code can change it.
					input: false
				},
				// Host reputation flag. Optional (not `required`) so existing user rows
				// created before this field still pass schema validation; new users get
				// `false` via defaultValue. Server-only — clients can't set it via
				// signUp/updateUser. Readers should treat undefined as false.
				isSuperhost: {
					type: 'boolean',
					required: false,
					defaultValue: false,
					input: false
				}
			}
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			minPasswordLength: 8,
			maxPasswordLength: 128
		},
		// Auth HTTP limits live in {@link convexRateLimitRegistry} and are enforced via
		// {@link convexCreateAuthRateLimitHook} using `@convex-dev/rate-limiter`.
		rateLimit: {
			enabled: false
		},
		hooks: {
			before: convexCreateAuthRateLimitHook(ctx)
		},
		account: {
			accountLinking: {
				enabled: true,
				trustedProviders: ['google', 'credential']
			}
		},
		// Real client IP is delivered via our SvelteKit auth proxy under `x-client-ip`
		// (see `routes/api/auth/[...all]/+server.ts`). Only that header is trusted —
		// `cf-connecting-ip` / `x-forwarded-for` on Convex are rewritten to the
		// immediate hop (Vercel egress), not the end user.
		advanced: {
			ipAddress: {
				ipAddressHeaders: ['x-client-ip']
			}
		},
		socialProviders: {
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID!,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET!
			}
		},
		plugins: [
			emailOTP({
				otpLength: 8,
				sendVerificationOnSignUp: true,
				sendVerificationOTP
			}),
			admin({
				defaultRole: 'user',
				adminRoles: ['admin']
			}),
			convex({ authConfig })
		]
	} satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	return betterAuth(createAuthOptions(ctx));
};
