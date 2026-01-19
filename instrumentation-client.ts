import posthog from 'posthog-js'

// Setup PostHog on client side
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: '/ingest', // Uses the proxy we set up in next.config.ts
  ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  person_profiles: 'identified_only', // API version
  capture_pageleave: true,
  session_recording: {
    maskAllInputs: true,
    maskTextSelector: '[data-private]',
  },
  debug: process.env.NODE_ENV === 'development',
})
