/// <reference types="@serwist/next/typings" />
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, RouteMatchCallbackOptions, SerwistGlobalConfig } from 'serwist'
import { NetworkOnly, Serwist } from 'serwist'

// Relative rather than the '@/' alias on purpose: this file is compiled by
// @serwist/next's own bundler pass, not the app's, so it should not depend on
// that pass picking up the tsconfig path aliases.
import { resolveNotificationUrl } from '../features/notifications/utils/notification-routing'
import type { NotificationPayload } from '../features/notifications/utils/types'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: WorkerGlobalScope & SerwistGlobalConfig

// Never cache API/analytics: React Query owns app data, the SW only the shell.
const networkOnly = {
  matcher: ({ url, sameOrigin }: RouteMatchCallbackOptions) =>
    sameOrigin && (url.pathname.startsWith('/api') || url.pathname.startsWith('/ingest')),
  handler: new NetworkOnly(),
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [networkOnly, ...defaultCache],
})

serwist.addEventListeners()

// The `declare const self` above narrows self's type to just what Serwist's
// setup needs (WorkerGlobalScope & SerwistGlobalConfig), which drops the
// push/notification/clients APIs that only exist on the real service worker
// global. Cast locally rather than widening that shared declaration.
const sw = self as unknown as ServiceWorkerGlobalScope

// Mentee engagement reminders (stale-report nudges, assigned instructions)
// and new messages arrive here when the tab is closed. The API sends a JSON
// payload shaped like { title, body, data }, where `data` is the same routing
// payload it stores on the Notification row — a `type` discriminant plus the
// id that type needs, not a literal url. resolveNotificationUrl below turns
// it into a destination.
sw.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return

  let payload: { title?: string; body?: string; data?: Record<string, unknown> } = {}
  try {
    payload = event.data.json()
  } catch {
    // Non-JSON payload — nothing useful to show, drop it.
    return
  }

  const title = payload.title ?? 'GoalSlot'
  event.waitUntil(
    sw.registration.showNotification(title, {
      body: payload.body,
      data: payload.data,
      icon: '/icons/goalslot-logo-boxed.svg',
      badge: '/icons/goalslot-logo-64.svg',
    }),
  )
})

// Same focus-or-open-a-client approach as the local timer reminders in
// useTimerNotifications (window.focus() on an existing tab), extended to
// also navigate to the URL the payload pointed at when one is present.
//
// The routing table itself lives in notification-routing.ts, shared with the
// in-app notification list. It used to be duplicated here, which is how the
// two surfaces silently drifted apart: this one learned to route messages
// while the in-app list still navigated nowhere for anything but a feedback
// reply. Teaching a new notification type where to go is now one edit, in one
// file, and both surfaces get it.
sw.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()

  const targetUrl = resolveNotificationUrl(event.notification.data as NotificationPayload | undefined)

  event.waitUntil(
    (async () => {
      const allClients = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const existingClient = allClients.find((client) => client.url.includes(sw.location.origin))

      if (existingClient) {
        await existingClient.focus()
        if ('navigate' in existingClient) {
          await (existingClient as WindowClient).navigate(targetUrl)
        }
        return
      }

      await sw.clients.openWindow(targetUrl)
    })(),
  )
})
