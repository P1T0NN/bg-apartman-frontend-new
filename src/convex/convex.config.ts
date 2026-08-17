// LIBRARIES
import { defineApp } from 'convex/server';
import rateLimiter from '@convex-dev/rate-limiter/convex.config.js';
import r2 from '@convex-dev/r2/convex.config.js';
import analytics from '@vllnt/convex-analytics/convex.config';
import aggregate from '@convex-dev/aggregate/convex.config.js';
import betterAuth from './auth/component/convex.config';
import resend from '@convex-dev/resend/convex.config.js';

const app = defineApp();
app.use(rateLimiter);
app.use(betterAuth);
app.use(r2);
app.use(analytics);
app.use(resend);

// Counters + sum rollups — one `@convex-dev/aggregate` component instance per tree. The
// name IS the tree's identity: renaming one orphans its stored data.
//
// The first three are the table counters declared in `functions.ts`; the last four are the
// write-time SUM rollups (gmv / cancelled gmv / booked nights / released nights) declared in
// `analytics/sumRollups.ts`. `@vllnt/convex-analytics` handles COUNT metrics only — it has no
// SUM time-series — so the money/occupancy sums live on aggregate instead.
app.use(aggregate, { name: 'aggregateReports' });
app.use(aggregate, { name: 'aggregateApartments' });
app.use(aggregate, { name: 'aggregateHostEarnings' });
app.use(aggregate, { name: 'aggregateUsers' });
app.use(aggregate, { name: 'aggregateGmv' });
app.use(aggregate, { name: 'aggregateGmvCancelled' });
app.use(aggregate, { name: 'aggregateNightsBooked' });
app.use(aggregate, { name: 'aggregateNightsReleased' });

export default app;
