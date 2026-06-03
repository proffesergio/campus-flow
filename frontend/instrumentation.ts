// Sentry is disabled in this deployment, and this file is intentionally free of
// any @sentry/nextjs import.
//
// instrumentation.ts is loaded in the EDGE runtime too. @sentry/nextjs pulls in
// @opentelemetry, which uses a dynamic `require(expression)` the Edge Runtime
// cannot resolve. Even a dynamic import() guarded behind a runtime check still
// gets emitted into the edge middleware bundle by webpack, which makes the
// middleware edge function fail to initialize → MIDDLEWARE_INVOCATION_FAILED on
// Vercel. Keeping this file import-free is the only reliable way to keep Sentry
// out of the edge.
//
// To re-enable Sentry later, wire it back through withSentryConfig in
// next.config.ts (it handles the edge/node split safely) and restore the
// server/edge config imports there — not here.
export function register() {}
