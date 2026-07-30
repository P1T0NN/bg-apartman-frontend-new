// LIBRARIES
import { defineApp } from 'convex/server';
import rateLimiter from '@convex-dev/rate-limiter/convex.config.js';
import r2 from '@convex-dev/r2/convex.config.js';
import analytics from '@piton-/analytics-convex/convex.config.js';
import aggregate from '@convex-dev/aggregate/convex.config.js';
import betterAuth from './auth/component/convex.config';
import resend from '@convex-dev/resend/convex.config.js';

const app = defineApp();
app.use(rateLimiter);
app.use(betterAuth);
app.use(r2);
app.use(analytics);
app.use(resend);

// Table-count aggregates — one component instance per aggregated table.
// Counts ONLY (see GeneralSystemDesignRule.md § table counts); event analytics stay in @piton-/analytics-convex.
app.use(aggregate, { name: 'aggregateReports' });
app.use(aggregate, { name: 'aggregateApartments' });
app.use(aggregate, { name: 'aggregateHostEarnings' });

export default app;
