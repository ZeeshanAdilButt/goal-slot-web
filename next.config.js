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
    // Set DISABLE_POSTHOG_SOURCEMAPS=true for local builds — the
    // posthog-cli binary isn't installed everywhere and the upload
    // step otherwise fails the whole build after a successful compile.
    enabled: process.env.DISABLE_POSTHOG_SOURCEMAPS !== 'true',
    deleteAfterUpload: true, // Delete sourcemaps after upload for security
  },
})
