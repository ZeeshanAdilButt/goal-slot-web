/** @type {import('next').NextConfig} */
const withSerwist = require('@serwist/next').default({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  // Set DISABLE_PWA=true to skip the service worker (e.g. faster Turbopack dev).
  disable: process.env.DISABLE_PWA === 'true',
})

const { withPostHogConfig } = require('@posthog/nextjs-config')

// The browser talks to several origins that are configured per environment,
// not hardcoded: the NestJS API, the messaging service (HTTP + WebSocket),
// the SSO host and PostHog. Reduce each to a bare scheme://host[:port] so
// connect-src can name them. Anything unset or unparseable is dropped
// rather than widening the policy.
function toOrigin(value) {
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function connectSrcOrigins() {
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
  const candidates = [
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_MESSAGING_URL,
    process.env.NEXT_PUBLIC_MESSAGING_WS_URL,
    process.env.NEXT_PUBLIC_DW_SSO_URL,
    posthogHost,
    posthogHost.replace('us.i.posthog.com', 'us-assets.i.posthog.com'),
  ]

  const origins = new Set()
  for (const candidate of candidates) {
    const origin = toOrigin(candidate)
    if (origin) origins.add(origin)
  }
  // The messaging socket is opened as wss://<same host>, which is a
  // distinct CSP source from its https:// form.
  const wsOrigin = toOrigin(process.env.NEXT_PUBLIC_MESSAGING_WS_URL)
  if (wsOrigin) origins.add(wsOrigin.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:'))

  return Array.from(origins)
}

const nextConfig = {
  reactStrictMode: true,
  // Silence Turbopack warning by validating we acknowledge it
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  async rewrites() {
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
    const posthogAssetsHost = posthogHost.replace('us.i.posthog.com', 'us-assets.i.posthog.com')

    return [
      // Existing API rewrites
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/:path*`,
      },
      // PostHog rewrites
      {
        source: '/ingest/static/:path*',
        destination: `${posthogAssetsHost}/static/:path*`,
      },
      {
        source: '/ingest/:path*',
        destination: `${posthogHost}/:path*`,
      },
      {
        source: '/ingest/decide',
        destination: `${posthogHost}/decide`,
      },
    ]
  },

  // There is no middleware.ts in this app, so next.config.js is the only
  // place response headers can be set. Without these the app shipped no
  // framing, sniffing or referrer protection at all -- most concretely,
  // any site could iframe /dashboard/* invisibly and click-jack a logged-in
  // user through a destructive control.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Nothing in this app is meant to be embedded anywhere.
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Don't leak the share/note tokens that live in URLs to any
          // third-party origin the page happens to talk to.
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Permissions-Policy',
            // Dictation (Notes/Journal) needs the mic; nothing else here
            // needs camera, geolocation or payment.
            value: 'camera=(), geolocation=(), payment=(), microphone=(self)',
          },
          // REPORT-ONLY on purpose, and it must stay that way until the
          // violations have actually been looked at. A blocking CSP shipped
          // blind would fight Next's inline bootstrap and hydration
          // scripts, the PostHog snippet, and Tailwind/Framer inline
          // styles -- i.e. it would white-screen the app. The
          // 'unsafe-inline'/'unsafe-eval' below are what make even the
          // report-only pass quiet enough to read; tightening to a
          // nonce-based script-src is the follow-up, not this change.
          //
          // NOTE: no report-uri/report-to endpoint exists, so violations
          // surface in the browser console only. Nothing is collected
          // server-side. Treat this header as documentation of the intended
          // policy plus a local debugging aid, NOT as active protection.
          //
          // The one genuinely enforcing anti-framing control is
          // X-Frame-Options above; frame-ancestors here mirrors it for
          // when this policy is eventually switched to blocking.
          {
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://avatars.githubusercontent.com https://lh3.googleusercontent.com",
              "font-src 'self' data:",
              ['connect-src', "'self'", ...connectSrcOrigins()].join(' '),
              "worker-src 'self' blob:",
              "manifest-src 'self'",
            ].join('; '),
          },
        ],
      },
      // /cli/authorize is the one page where a single click grants a machine
      // full account access, which makes it the clickjacking target worth
      // paying for beyond the app-wide rules above: frame it in an attacker's
      // page, overlay a harmless-looking button on Approve, and the victim
      // authorizes a CLI they never ran.
      //
      // X-Frame-Options: DENY above already blocks that in every current
      // browser. This adds the *enforcing* CSP counterpart, which the app-wide
      // policy cannot give it because that one is deliberately report-only
      // until its violations have been read. Scoped to /cli/* so it carries
      // no risk of white-screening anything else, and it sets a different
      // header key from the report-only policy, so the two do not collide.
      {
        source: '/cli/:path*',
        headers: [{ key: 'Content-Security-Policy', value: "frame-ancestors 'none'" }],
      },
    ]
  },

  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,

  // Enable sourcemaps for better error tracking
  productionBrowserSourceMaps: true,
}

// Wrap config with PostHog configuration
module.exports = withPostHogConfig(withSerwist(nextConfig), {
  personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY ?? '',
  envId: process.env.POSTHOG_ENV_ID ?? '',
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  sourcemaps: {
    // Set DISABLE_POSTHOG_SOURCEMAPS=true for local builds — the
    // posthog-cli binary isn't installed everywhere and the upload
    // step otherwise fails the whole build after a successful compile.
    enabled: process.env.DISABLE_POSTHOG_SOURCEMAPS !== 'true',
    deleteAfterUpload: true, // Delete sourcemaps after upload for security
  },
})
