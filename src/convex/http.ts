import { httpRouter } from 'convex/server';
import { authComponent, createAuth } from './auth/auth';
import { paymentsWebhook } from './payments/paymentsWebhook';

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

// The single payment webhook endpoint (PaymentsSystemDesign.md §6) — signature-verified
// inside the handler, 404 while `PAYMENTS_CONFIG.PROVIDER` is `'none'`.
http.route({ path: '/payments/webhook', method: 'POST', handler: paymentsWebhook });

export default http;
