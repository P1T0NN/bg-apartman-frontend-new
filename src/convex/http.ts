import { httpRouter } from 'convex/server';
import { authComponent, createAuth } from './auth/auth';
import { stripeWebhook } from './payments/stripeWebhook';

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

// Stripe posts payment events here; the handler verifies the signature and forwards to
// internal mutations (StripeTODO §6b). Endpoint: https://<deployment>.convex.site/stripe/webhook
http.route({
	path: '/stripe/webhook',
	method: 'POST',
	handler: stripeWebhook
});

export default http;
