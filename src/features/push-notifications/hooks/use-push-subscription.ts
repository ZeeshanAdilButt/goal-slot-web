'use client'

import { useCallback, useEffect, useState } from 'react'

import { api } from '@/lib/api'

export type PushSubscriptionState = 'unsupported' | 'denied' | 'unsubscribed' | 'subscribing' | 'subscribed'

function isPushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
}

// VAPID keys are distributed base64url-encoded; PushManager.subscribe wants
// the raw bytes as a Uint8Array.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Browser-side web push opt-in for mentee engagement reminders. Mirrors the
 * permission-request convention in `useTimerNotifications` (plain
 * `Notification.requestPermission()`, no extra prompt library) and reuses
 * whatever service worker registration Serwist already installed rather
 * than registering a second one.
 */
export function usePushSubscription() {
  const [state, setState] = useState<PushSubscriptionState>('unsubscribed')
  // The backend row id for the current browser's subscription, needed to
  // target DELETE /push-subscriptions/:id. Not persisted — re-resolved from
  // the browser's own PushSubscription endpoint on mount (see below), since
  // that's the only handle we have when the id wasn't captured this session.
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)

  // Resolve the real starting state on mount: unsupported browser, a
  // previously denied permission, or a subscription that already exists
  // from an earlier visit all override the "unsubscribed" default.
  useEffect(() => {
    let cancelled = false

    async function detectInitialState() {
      if (!isPushSupported()) {
        if (!cancelled) setState('unsupported')
        return
      }
      if (Notification.permission === 'denied') {
        if (!cancelled) setState('denied')
        return
      }
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        const existing = await registration?.pushManager.getSubscription()
        if (!existing) return
        if (!cancelled) setState('subscribed')
        // Re-register (upsert) to recover the row id for an existing
        // browser subscription from an earlier visit — register() upserts
        // by endpoint, so this is a no-op on the backend, not a duplicate.
        const json = existing.toJSON()
        if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
          const { data: row } = await api.post<{ id: string }>('/push-subscriptions', {
            endpoint: json.endpoint,
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
          })
          if (!cancelled) setSubscriptionId(row.id)
        }
      } catch {
        // Registration not ready yet — leave the default state, subscribe() below re-checks.
      }
    }

    detectInitialState()
    return () => {
      cancelled = true
    }
  }, [])

  const subscribe = useCallback(async () => {
    if (!isPushSupported()) {
      setState('unsupported')
      return
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    // No VAPID key configured (e.g. local dev without the env var set) —
    // resolve to unsupported instead of throwing so the rest of the app
    // keeps working.
    if (!vapidPublicKey) {
      setState('unsupported')
      return
    }

    setState('subscribing')

    try {
      let permission = Notification.permission
      if (permission === 'default') {
        permission = await Notification.requestPermission()
      }
      if (permission !== 'granted') {
        setState('denied')
        return
      }

      // Serwist registers /sw.js on page load; fall back to registering it
      // ourselves only if that hasn't happened yet (e.g. called very early).
      const registration = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register('/sw.js'))
      await navigator.serviceWorker.ready

      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          // Uint8Array's ArrayBufferLike backing isn't assignable to the
          // stricter ArrayBuffer-only BufferSource type lib.dom now expects;
          // the runtime shape is exactly what PushManager.subscribe wants.
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
        }))

      const json = subscription.toJSON()
      const endpoint = json.endpoint
      const p256dh = json.keys?.p256dh
      const auth = json.keys?.auth

      if (!endpoint || !p256dh || !auth) {
        throw new Error('Push subscription is missing its endpoint or keys')
      }

      const { data: row } = await api.post<{ id: string }>('/push-subscriptions', { endpoint, p256dh, auth })

      setSubscriptionId(row.id)
      setState('subscribed')
    } catch (error) {
      setState('unsubscribed')
      throw error
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    if (!isPushSupported()) return

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      const existing = await registration?.pushManager.getSubscription()
      await existing?.unsubscribe()

      if (subscriptionId) {
        await api.delete(`/push-subscriptions/${subscriptionId}`)
      }

      setSubscriptionId(null)
      setState('unsubscribed')
    } catch (error) {
      // Leave state as 'subscribed' — the toggle failed, so nothing actually
      // changed; better to let the user retry than show a false unsubscribed state.
      throw error
    }
  }, [subscriptionId])

  return { state, subscribe, unsubscribe }
}
