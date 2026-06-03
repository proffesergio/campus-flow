// Sentry is fully optional and only loads when a DSN is configured. We avoid a
// top-level `import @sentry/nextjs` on purpose: without withSentryConfig's
// webpack plugin (which is itself gated on a DSN in next.config.ts), Sentry's
// code is not edge-safe and throws `__dirname is not defined` when pulled into
// the edge runtime. Lazy-loading behind the DSN check keeps the edge bundle
// Sentry-free in DSN-less deploys.
const SENTRY_ENABLED = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

export async function register() {
  if (!SENTRY_ENABLED) return;
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export async function onRequestError(
  ...args: Parameters<typeof import('@sentry/nextjs').captureRequestError>
) {
  if (!SENTRY_ENABLED) return;
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureRequestError(...args);
}
