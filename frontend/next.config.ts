import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

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

// Sentry is intentionally NOT wired into the build.
//
// withSentryConfig instruments the Edge middleware at build time. With
// @sentry/nextjs 8 + Next 15 that injects Node-only code (`__dirname`) into the
// edge bundle, so on Vercel the middleware throws
// `ReferenceError: __dirname is not defined` → MIDDLEWARE_INVOCATION_FAILED (500
// on every route). This fires whenever Sentry is active at build time —
// including when a DSN/token is supplied by the Vercel Sentry integration, which
// does NOT appear in the project's Environment Variables list. A DSN-gated wrap
// is therefore not enough; the only reliable fix is to keep withSentryConfig out
// of the build entirely. (Verified: without it the built middleware is ~33 kB
// with zero `__dirname`/`@sentry` references.)
//
// To re-enable Sentry later: re-add withSentryConfig, upgrade @sentry/nextjs to
// a version whose edge handling is fixed, and confirm `.next/server/middleware.js`
// contains no `__dirname` before deploying.
export default withNextIntl(nextConfig);
