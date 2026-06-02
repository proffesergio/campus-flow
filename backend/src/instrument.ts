/**
 * Sentry initialization. Imported FIRST in server.ts so auto-instrumentation
 * wraps later requires. No-op (and silent) when SENTRY_DSN is not set, so local
 * dev and CI run unchanged.
 */
import * as Sentry from '@sentry/node';

const dsn = process.env['SENTRY_DSN'];

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env['NODE_ENV'] ?? 'development',
    tracesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.1 : 0,
  });
  // eslint-disable-next-line no-console
  console.log('[sentry] backend error tracking enabled');
}

export const sentryEnabled = !!dsn;
export { Sentry };
