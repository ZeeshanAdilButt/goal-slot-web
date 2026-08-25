import posthog from 'posthog-js'

/**
 * The OAuth callback lands on /auth/callback?token=...&refresh=..., and the
 * page scrubs those params in an effect. PostHog captures its pageview and
 * starts recording before that effect runs, so without this the access and
 * refresh tokens end up in $current_url and in the session replay.
 *
 * maskAllInputs does not help here: a query string is not an input.
 */
const SENSITIVE_PATHS = ['/auth/callback']

function redactUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl)
    if (!SENSITIVE_PATHS.some((path) => url.pathname.startsWith(path))) return rawUrl
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return rawUrl
  }
}

// Setup PostHog on client side
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: '/ingest', // Uses the proxy we set up in next.config.ts
  sanitize_properties: (properties) => {
    for (const key of ['$current_url', '$referrer', '$pathname'] as const) {
      const value = properties[key]
      if (typeof value === 'string') properties[key] = redactUrl(value)
    }
    return properties
  },
  ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  person_profiles: 'identified_only', // API version
  capture_pageleave: true,
  session_recording: {
    maskAllInputs: true,
    maskTextSelector: '[data-private]',
  },
  debug: process.env.NEXT_PUBLIC_POSTHOG_DEBUG === 'true' && process.env.NODE_ENV !== 'production',
})
