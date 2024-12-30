// Import with `const Sentry = require("@sentry/nestjs");` if you are using CJS
import * as Sentry from "@sentry/nestjs"
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import 'dotenv/config';

Sentry.init({
  dsn: process.env.SENTRY_DSN_FILE,
  integrations: [
    nodeProfilingIntegration(),
  ],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
});
// Manually call startProfiling and stopProfiling
// to profile the code in between
Sentry.profiler.startProfiler()
// this code will be profiled

// Calls to stopProfiler are optional - if you don't stop the profiler, it will keep profiling
// your application until the process exits or stopProfiler is called.
Sentry.profiler.stopProfiler()
