/** @type {import('next').NextConfig} */
const withSerwist = require('@serwist/next').default({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  // Set DISABLE_PWA=true to skip the service worker (e.g. faster Turbopack dev).
  disable: process.env.DISABLE_PWA === 'true',
})

const { withPostHogConfig } = require('@posthog/nextjs-config')

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
  // /cli/authorize is the one page in this app where a single click grants a
  // machine full account access, which makes it the obvious clickjacking
  // target: frame it inside an attacker's page, overlay a harmless-looking
  // button on top of Approve, and the victim authorizes a CLI they never ran.
  // Scoped to /cli/* rather than applied globally so this cannot break the
  // share and embed routes.
  async headers() {
    return [
      {
        source: '/cli/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          // Nothing on this page belongs in a referrer sent to a third party,
          // and the loopback redirect it navigates to least of all.
          { key: 'Referrer-Policy', value: 'no-referrer' },
        ],
      },
    ]
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
    enabled: true, // Enable sourcemaps generation and upload
    deleteAfterUpload: true, // Delete sourcemaps after upload for security
  },
})
