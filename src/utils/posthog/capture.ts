import posthog from 'posthog-js'

import { type EventName, type EventProperties } from './events'

/**
 * Typed PostHog capture helper.
 *
 * Usage:
 *   capture(Events.GOAL_CREATED, { hasDeadline: true })
 *   capture(Events.AUTH_LOGOUT)
 *
 * - Fully type-checked: wrong event names or wrong properties fail at compile time.
 * - Safe to call server-side: no-ops when window is undefined (Next.js SSR).
 */
export function capture<E extends EventName>(
  event: E,
  props?: E extends keyof EventProperties ? EventProperties[E] : Record<string, never>,
): void {
  if (typeof window === 'undefined') return
  posthog.capture(event, props)
}
