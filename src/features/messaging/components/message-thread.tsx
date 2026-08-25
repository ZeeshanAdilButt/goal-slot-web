'use client'

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { MessageBubble } from '@/features/messaging/components/message-bubble'
import { MessageComposer } from '@/features/messaging/components/message-composer'
import {
  useMarkConversationReadMutation,
  useSendMessageMutation,
} from '@/features/messaging/hooks/use-messaging-mutations'
import { useConversationQuery, useMessagesQuery } from '@/features/messaging/hooks/use-messaging-queries'
import { messagingErrorMessage } from '@/features/messaging/utils/client'
import {
  displayName,
  formatDayHeading,
  getCounterpartIds,
  getLastReadAt,
  isSameDay,
  isSeenByCounterparts,
} from '@/features/messaging/utils/helpers'
import { MessagingPerson } from '@/features/messaging/utils/types'
import { ArrowLeft, MessageSquare, WifiOff } from 'lucide-react'

import { useAuthStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Loading } from '@/components/ui/loading'

const AUTOSCROLL_THRESHOLD_PX = 120

interface MessageThreadProps {
  conversationId: string
  directory: Map<string, MessagingPerson>
  /** Rendered on narrow screens where the thread replaces the list. */
  onBack: () => void
}

export function MessageThread({ conversationId, directory, onBack }: MessageThreadProps) {
  const currentUserId = useAuthStore((state) => state.user?.id)
  const isOnline = useOnlineStatus()

  // Polled while the thread is open: the counterpart's read receipt
  // (participants[].lastReadAt) only ever arrives via a query response,
  // there is no WebSocket push for "conversation was read" the way there
  // is for new messages.
  const conversationQuery = useConversationQuery(conversationId, { refetchInterval: 10_000 })
  const messagesQuery = useMessagesQuery(conversationId)
  const sendMessage = useSendMessageMutation(conversationId)
  const markRead = useMarkConversationReadMutation()

  const panelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLOListElement>(null)
  const shouldAutoscrollRef = useRef(true)
  const seenLatestRef = useRef<string | null>(null)
  const hasLoadedOnceRef = useRef(false)
  const markedReadForRef = useRef<string | null>(null)

  const [announcement, setAnnouncement] = useState('')

  const messages = useMemo(() => messagesQuery.data ?? [], [messagesQuery.data])
  const conversation = conversationQuery.data

  const nameFor = useCallback((userId: string) => displayName(directory.get(userId)), [directory])

  const lastOwnMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].senderId === currentUserId) return messages[index].id
    }
    return null
  }, [messages, currentUserId])

  const counterpartIds = getCounterpartIds(conversation, currentUserId)
  const conversationName = counterpartIds.length
    ? counterpartIds.map(nameFor).join(', ')
    : conversationQuery.isLoading
      ? 'Loading conversation'
      : 'Conversation'

  // Opening a conversation moves focus into the thread panel so keyboard and
  // screen reader users land on the content that just replaced the list.
  useEffect(() => {
    shouldAutoscrollRef.current = true
    hasLoadedOnceRef.current = false
    seenLatestRef.current = null
    markedReadForRef.current = null
    setAnnouncement('')
    panelRef.current?.focus()
  }, [conversationId])

  const handleScroll = useCallback(() => {
    const element = scrollRef.current
    if (!element) return
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight
    shouldAutoscrollRef.current = distanceFromBottom <= AUTOSCROLL_THRESHOLD_PX
  }, [])

  // Stick to the newest message, unless the user has scrolled up to read back.
  useEffect(() => {
    const element = scrollRef.current
    if (!element || !messages.length) return
    if (!shouldAutoscrollRef.current) return
    element.scrollTop = element.scrollHeight
  }, [messages])

  // Announce only genuinely new incoming messages: the initial load and the
  // user's own sends would otherwise spam the live region.
  useEffect(() => {
    if (!messages.length) return
    const latest = messages[messages.length - 1]

    if (!hasLoadedOnceRef.current) {
      hasLoadedOnceRef.current = true
      seenLatestRef.current = latest.id
      return
    }

    if (seenLatestRef.current === latest.id) return
    seenLatestRef.current = latest.id
    if (latest.senderId === currentUserId) return

    setAnnouncement(`New message from ${nameFor(latest.senderId)}: ${latest.body}`)
  }, [currentUserId, messages, nameFor])

  // Viewing the thread marks it read. Keyed on the newest message so a message
  // arriving while the thread is open marks read again, but nothing loops.
  useEffect(() => {
    if (!conversation || !currentUserId || !messages.length) return

    const latest = messages[messages.length - 1]
    if (latest.pending) return

    const key = `${conversationId}:${latest.id}`
    if (markedReadForRef.current === key) return

    const lastReadAt = getLastReadAt(conversation, currentUserId)
    const alreadyRead = lastReadAt && new Date(lastReadAt).getTime() >= new Date(latest.createdAt).getTime()
    if (alreadyRead) {
      markedReadForRef.current = key
      return
    }

    markedReadForRef.current = key
    markRead.mutate(conversationId)
    // markRead is a stable mutation object from React Query; including it
    // would re-run this on every mutation state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation, conversationId, currentUserId, messages])

  const handleSend = useCallback(
    async (body: string) => {
      try {
        await sendMessage.mutateAsync(body)
        shouldAutoscrollRef.current = true
        return true
      } catch {
        return false
      }
    },
    [sendMessage],
  )

  const isLoading = messagesQuery.isLoading || conversationQuery.isLoading
  const error = messagesQuery.error ?? conversationQuery.error

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="region"
      aria-label={`Conversation with ${conversationName}`}
      className="flex min-h-[28rem] flex-1 flex-col rounded-xl border border-zinc-200 bg-zinc-50/60 outline-none focus-visible:ring-2 focus-visible:ring-[#f2cc0d]"
    >
      <header className="flex items-center gap-2 border-b border-zinc-200 bg-white px-3 py-2.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0 md:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-zinc-900">{conversationName}</h2>
          <p className="truncate text-[11px] text-zinc-500">
            {counterpartIds.length === 1 ? directory.get(counterpartIds[0])?.email || 'Shared with you' : 'Group'}
          </p>
        </div>
      </header>

      {!isOnline && (
        <p className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          You are offline. Messages will send once you reconnect.
        </p>
      )}

      <ol
        ref={scrollRef}
        onScroll={handleScroll}
        tabIndex={0}
        aria-label="Messages, oldest first"
        className={cn(
          'flex-1 space-y-3 overflow-y-auto p-3 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f2cc0d]',
          'max-h-[min(60vh,32rem)]',
        )}
      >
        {isLoading && (
          <li className="flex h-40 items-center justify-center">
            <Loading />
            <span className="sr-only">Loading messages</span>
          </li>
        )}

        {!isLoading && error && (
          <li>
            <EmptyState
              icon={<MessageSquare />}
              title="Could not load this conversation"
              description={messagingErrorMessage(error)}
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    void messagesQuery.refetch()
                    void conversationQuery.refetch()
                  }}
                >
                  Try again
                </Button>
              }
            />
          </li>
        )}

        {!isLoading && !error && messages.length === 0 && (
          <li>
            <EmptyState
              icon={<MessageSquare />}
              title="No messages yet"
              description={`Say hello to ${conversationName}.`}
            />
          </li>
        )}

        {!isLoading &&
          !error &&
          messages.map((message, index) => {
            const previous = index > 0 ? messages[index - 1] : undefined
            const showDayHeading = !previous || !isSameDay(previous.createdAt, message.createdAt)

            return (
              <Fragment key={message.id}>
                {showDayHeading && (
                  <li className="flex items-center gap-3 py-1" aria-hidden="true">
                    <span className="h-px flex-1 bg-zinc-200" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                      {formatDayHeading(message.createdAt)}
                    </span>
                    <span className="h-px flex-1 bg-zinc-200" />
                  </li>
                )}
                <MessageBubble
                  message={message}
                  isOwn={message.senderId === currentUserId}
                  senderName={nameFor(message.senderId)}
                  isSeen={
                    message.id === lastOwnMessageId ? isSeenByCounterparts(conversation, currentUserId, message) : undefined
                  }
                />
              </Fragment>
            )
          })}
      </ol>

      <MessageComposer
        conversationName={conversationName}
        disabled={!isOnline || !!error}
        disabledReason={!isOnline ? 'You are offline' : 'Messaging is unavailable'}
        isSending={sendMessage.isPending}
        onSend={handleSend}
      />

      {/* Only new incoming messages land here, so the announcement is not a
          replay of the whole thread on load. */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </div>
  )
}
