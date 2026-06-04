import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.digitaloceanspaces.com" },
      { protocol: "https", hostname: "*.cdn.digitaloceanspaces.com" },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["*.campusflow.app", "localhost:3000"] },
  },
};

// Sentry wraps the config for error monitoring + (optional) source-map upload.
// Source maps only upload when SENTRY_AUTH_TOKEN is present, so local/CI builds
// work unchanged. Runtime error capture is gated on NEXT_PUBLIC_SENTRY_DSN.
//
// Only wrap when Sentry is actually configured: withSentryConfig injects edge
// middleware instrumentation that, with @sentry/nextjs 8 + Next 15, throws
// MIDDLEWARE_INVOCATION_FAILED at runtime when no DSN is set. Gating on the env
// vars keeps the middleware clean in DSN-less deploys and auto-enables Sentry
// the moment a DSN / auth token is provided.
// Gate on the DSN ONLY (not SENTRY_AUTH_TOKEN). Sentry can't report without a
// DSN, so wrapping on the auth token alone just injects edge middleware
// instrumentation that throws MIDDLEWARE_INVOCATION_FAILED for no benefit. This
// must stay consistent with the DSN gate in instrumentation.ts.
const config = withNextIntl(nextConfig);
const sentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

export default sentryEnabled
  ? withSentryConfig(config, {
      silent: !process.env.CI,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      disableLogger: true,
    })
  : config;
