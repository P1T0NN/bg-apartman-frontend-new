// LIBRARIES
import { createClient, type AuthFunctions, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { components, internal } from '../_generated/api';
import type { DataModel } from '../_generated/dataModel';
import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal';
import { admin, emailOTP } from 'better-auth/plugins';
import authConfig from './auth.config';
import { analytics, ANALYTICS_EVENT } from '@/convex/analytics';
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
		user: {
			onCreate: async (ctx, user) => {
				await analytics.track(ctx, ANALYTICS_EVENT.USER_SIGNED_UP, {
					actorId: user._id,
					properties: { role: user.role }
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
