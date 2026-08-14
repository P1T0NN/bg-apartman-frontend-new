// SVELTEKIT IMPORTS
import { RESEND_API_KEY, SEARCH_INPUT_RATE_LIMIT_SECRET } from '$env/static/private';
import { getRequestEvent } from '$app/server';
import { m } from '@/lib/paraglide/messages';

// LIBRARIES
import { Resend } from 'resend';
import { isRateLimitError } from '@convex-dev/rate-limiter';
import { createConvexHttpClient } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { api } from '@/convex/_generated/api';

// CONFIG
import { COMPANY_DATA } from '@/shared/config';

// UTILS
import { safeCommand } from '@/utils/remoteFunctionsUtils';
import { escapeHtml } from '@/shared/utils/escapeHtml.js';
import { resolveClientAddress } from '@/utils/clientAddress.js';

// SCHEMAS
import { sendContactFormEmailSchema } from '@/shared/features/contact/schemas/contactSchemas';

/**
 * Charge the `contactForm` bucket before sending.
 *
 * BotID (via `safeCommand`) already turns bots away; this is the limit on a *human* holding
 * the send button down, because every accepted submission is an email into the company inbox.
 * Keyed by client IP — a remote function has one, and the form's own email field is
 * attacker-supplied so it is worth nothing as an identity.
 *
 * Reuses the trusted rate-limit bridge the public search inputs use: only Convex holds the
 * buckets, and the shared secret keeps browsers from charging arbitrary keys.
 */
async function chargeContactFormLimit(): Promise<{ ok: true } | { ok: false; message: string }> {
	const ip = resolveClientAddress(getRequestEvent());
	if (!ip) return { ok: false, message: m['contactActionsRemote.couldNotVerifyRequest']() };

	try {
		await createConvexHttpClient().mutation(
			api.rateLimits.searchRateLimitMutations.consumeSearchRateLimit,
			{
				name: 'contactForm',
				source: 'contact',
				fallbackKey: `contact-form:ip:${ip}`,
				// Never upgrade to a user key: a signed-in sender must not get a bucket of their
				// own on top of their IP's.
				authenticatedKey: 'fallback',
				secret: SEARCH_INPUT_RATE_LIMIT_SECRET
			},
			{ skipQueue: true }
		);
		return { ok: true };
	} catch (cause) {
		if (isRateLimitError(cause)) {
			return { ok: false, message: m['contactActionsRemote.tooManyMessages']() };
		}
		return { ok: false, message: m['contactActionsRemote.couldNotSendMessage']() };
	}
}

export const sendContactFormEmail = safeCommand(sendContactFormEmailSchema, async (data) => {
	const limit = await chargeContactFormLimit();
	if (!limit.ok) return { success: false, message: limit.message, data: null };

	const resend = new Resend(RESEND_API_KEY);

	const { error } = await resend.emails.send({
		from: `Website Contact Form <noreply@${COMPANY_DATA.DOMAIN}>`,
		to: [COMPANY_DATA.EMAIL],
		subject: 'Website contact form',
		html: `
			<p>Name: ${escapeHtml(data.name)}</p>
			<p>Email: ${escapeHtml(data.email)}</p>
			<p>Message: ${escapeHtml(data.message)}</p>
		`
	});

	if (error) {
		return { success: false, message: error.message, data: null };
	}

	return { success: true, message: m['contactActionsRemote.emailSentSuccessfully'](), data: null };
});
