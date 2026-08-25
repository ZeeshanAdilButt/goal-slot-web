'use client'

import { useEffect, useState } from 'react'

import { useMessagingTokenQuery } from '@/features/messaging/hooks/use-messaging-token'
import {
  applyMessageDeletionToCaches,
  applyMessageToConversationList,
  resyncMessagingCaches,
  upsertMessageInCache,
} from '@/features/messaging/utils/cache'
import { isMessagingConfigured, isMessagingRealtimeConfigured, messagingWsUrl } from '@/features/messaging/utils/config'
import { isDeletedMessage, parseSocketMessage } from '@/features/messaging/utils/helpers'
import { MessagingConnectionStatus } from '@/features/messaging/utils/types'
import { useQueryClient } from '@tanstack/react-query'

import { useOnlineStatus } from '@/hooks/use-online-status'

const RECONNECT_BASE_MS = 1_000
const RECONNECT_MAX_MS = 30_000

/** Exponential backoff with jitter so reconnects do not thunder on restart. */
const backoffFor = (attempt: number): number => {
  const ceiling = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** attempt)
  return Math.round(ceiling * (0.5 + Math.random() * 0.5))
}

/**
 * Holds the messaging WebSocket for as long as the component is mounted and
 * folds every pushed message straight into the TanStack Query cache, so an
 * open thread updates without a refetch.
 *
 * The token goes in the query string because browsers cannot set headers on a
 * WS handshake; the service verifies it during the upgrade.
 */
export function useMessagingSocket(): MessagingConnectionStatus {
  const queryClient = useQueryClient()
  const tokenQuery = useMessagingTokenQuery()
  const token = tokenQuery.data
  const isOnline = useOnlineStatus()

  const [status, setStatus] = useState<MessagingConnectionStatus>(
    isMessagingRealtimeConfigured ? 'connecting' : 'disabled',
  )

  useEffect(() => {
    if (!isMessagingRealtimeConfigured || typeof WebSocket === 'undefined') {
      setStatus('disabled')
      return
    }

    if (!isOnline) {
      setStatus('offline')
      return
    }

    if (!token) {
      setStatus('connecting')
      return
    }

    // Everything below belongs to this one effect run. `cancelled` is what
    // stops a pending reconnect from resurrecting a socket after unmount or
    // after the token rotated.
    let cancelled = false
    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    let attempt = 0
    let hasConnectedOnce = false

    const scheduleReconnect = () => {
      if (cancelled) return
      setStatus('reconnecting')
      reconnectTimer = setTimeout(connect, backoffFor(attempt))
      attempt += 1
    }

    function connect() {
      if (cancelled) return
      setStatus(attempt === 0 ? 'connecting' : 'reconnecting')

      let next: WebSocket
      try {
        next = new WebSocket(`${messagingWsUrl}/?token=${encodeURIComponent(token as string)}`)
      } catch {
        scheduleReconnect()
        return
      }

      socket = next

      next.onopen = () => {
        if (cancelled) return
        attempt = 0
        setStatus('open')
        // Messages sent while we were disconnected were never pushed to us,
        // so close the gap once on every reconnect (but not on first open,
        // where the queries are loading anyway).
        if (hasConnectedOnce) resyncMessagingCaches(queryClient)
        hasConnectedOnce = true
      }

      next.onmessage = (event: MessageEvent) => {
        if (cancelled) return
        const message = parseSocketMessage(event.data)
        if (!message) return

        // The service pushes a deletion as the tombstone itself, on the same
        // socket as a new message. Treating it as one would move the
        // conversation to the top of the list and overwrite its preview with
        // "this message was deleted" even when a newer message exists.
        if (isDeletedMessage(message)) {
          applyMessageDeletionToCaches(queryClient, message)
          return
        }

        upsertMessageInCache(queryClient, message)
        applyMessageToConversationList(queryClient, message)
      }

      next.onerror = () => {
        // A close event always follows; reconnect is handled there.
      }

      next.onclose = () => {
        if (cancelled) return
        socket = null
        scheduleReconnect()
      }
    }

    connect()

    return () => {
      cancelled = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (socket) {
        socket.onopen = null
        socket.onmessage = null
        socket.onerror = null
        socket.onclose = null
        // 1000: normal closure. The socket may still be CONNECTING, in which
        // case close() aborts the handshake, which is what we want.
        socket.close(1000, 'component unmounted')
        socket = null
      }
    }
  }, [isOnline, queryClient, token])

  if (!isMessagingConfigured) return 'disabled'
  return status
}
