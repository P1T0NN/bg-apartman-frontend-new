// LIBRARIES
import { defineApp } from "convex/server";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
import r2 from "@convex-dev/r2/convex.config.js";
import analytics from "@piton-/analytics-convex/convex.config.js";
import betterAuth from './auth/component/convex.config';
import resend from "@convex-dev/resend/convex.config.js";

const app = defineApp();
app.use(rateLimiter);
app.use(betterAuth);
app.use(r2);
app.use(analytics);
app.use(resend);

export default app;
