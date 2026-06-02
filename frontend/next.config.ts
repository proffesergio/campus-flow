import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.digitaloceanspaces.com' },
      { protocol: 'https', hostname: '*.cdn.digitaloceanspaces.com' },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ['*.campusflow.app', 'localhost:3000'] },
  },
};

// Sentry wraps the config for error monitoring + (optional) source-map upload.
// Source maps only upload when SENTRY_AUTH_TOKEN is present, so local/CI builds
// work unchanged. Runtime error capture is gated on NEXT_PUBLIC_SENTRY_DSN.
export default withSentryConfig(withNextIntl(nextConfig), {
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  disableLogger: true,
});
