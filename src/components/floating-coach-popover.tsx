'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Maximize2,
  MessageCircle,
  Pencil,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  X,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

import {
  coachApi,
  type CoachMessageDto,
  type CoachStreamChunk,
} from '@/lib/api'
import { cn } from '@/lib/utils'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { CoachMarkdown } from '@/features/coach/components/coach-markdown'
import { CoachErrorText, showCoachStreamError, statusOf } from '@/features/coach/utils/stream-error-toast'
import {
  CoachProposalCard,
  extractCoachProposals,
} from '@/features/coach/components/coach-proposal-card'

function currentScopeKey(): string {
  const now = new Date()
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

interface ChatMessageView {
  id: string
  role: 'USER' | 'ASSISTANT' | 'SYSTEM_NARRATIVE'
  content: string
  pending?: boolean
}

interface FloatingCoachPopoverProps {
  open: boolean
  onClose: () => void
}

export function FloatingCoachPopover({ open, onClose }: FloatingCoachPopoverProps) {
  const queryClient = useQueryClient()
  const [scopeKey, setScopeKey] = useState('')
  useEffect(() => {
    setScopeKey(currentScopeKey())
  }, [])

  const historyQuery = useQuery<CoachMessageDto[]>({
    queryKey: ['coach', 'chat', scopeKey],
    enabled: open && !!scopeKey,
    queryFn: async () => {
      const res = await coachApi.getChatHistory(scopeKey)
      return res.data ?? []
    },
  })

  const persistedMessages = useMemo<ChatMessageView[]>(() => {
    return (historyQuery.data ?? [])
      .filter((m) => m.role === 'USER' || m.role === 'ASSISTANT')
      .map((m) => ({ id: m.id, role: m.role, content: m.content }))
  }, [historyQuery.data])

  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [optimistic, setOptimistic] = useState<ChatMessageView[]>([])
  const [streamingReply, setStreamingReply] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [editingFromMessageId, setEditingFromMessageId] = useState<string | null>(null)

  const handleEditMessage = (id: string, content: string) => {
    setEditingFromMessageId(id)
    setInput(content)
    inputRef.current?.focus()
  }

  const cancelEdit = () => {
    setEditingFromMessageId(null)
    setInput('')
  }

  // Intentionally do NOT abort the SSE when the popover closes or when the
  // component unmounts. If the user closes the popover mid-reply we want the
  // server to still finish, persist the message, so the next time they open
  // the popover (or visit the Coach page) the reply is just there. Only the
  // explicit Stop button aborts.

  const allMessages = useMemo<ChatMessageView[]>(() => {
    const list = [...persistedMessages, ...optimistic]
    if (streaming && streamingReply) {
      list.push({
        id: 'streaming-assistant',
        role: 'ASSISTANT',
        content: streamingReply,
        pending: true,
      })
    } else if (streaming) {
      list.push({
        id: 'streaming-assistant',
        role: 'ASSISTANT',
        content: '…',
        pending: true,
      })
    }
    return list
  }, [persistedMessages, optimistic, streaming, streamingReply])

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [allMessages.length, streamingReply])

  const handleSend = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || streaming || !scopeKey) return
      setError(null)
      setInput('')

      // Edit-and-resend: truncate the chat from the edited message before
      // sending so the now-stale reply chain is gone (server + cache).
      const editingId = editingFromMessageId
      if (editingId) {
        try {
          await coachApi.truncateChatFrom(scopeKey, editingId)
          queryClient.setQueryData<CoachMessageDto[]>(
            ['coach', 'chat', scopeKey],
            (prev) => {
              if (!prev) return prev
              const idx = prev.findIndex((m) => m.id === editingId)
              return idx === -1 ? prev : prev.slice(0, idx)
            },
          )
        } catch (err) {
          const m = err instanceof Error ? err.message : 'Could not edit'
          toast.error(m)
          setEditingFromMessageId(null)
          return
        }
        setEditingFromMessageId(null)
      }

      const userMsgId = `local_user_${Date.now()}`
      setOptimistic((prev) => [
        ...prev,
        { id: userMsgId, role: 'USER', content: trimmed },
      ])
      setStreamingReply('')
      setStreaming(true)
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const iter = await coachApi.streamChat(scopeKey, trimmed, {
          signal: controller.signal,
        })
        let acc = ''
        let streamErr: string | undefined
        for await (const chunk of iter as AsyncGenerator<CoachStreamChunk>) {
          if (chunk.error) {
            streamErr = chunk.error
            break
          }
          if (chunk.delta) {
            acc += chunk.delta
            setStreamingReply(acc)
          }
          if (chunk.done) break
        }
        if (streamErr) {
          // SSE bridge wraps backend throws (budget exceeded, key removed)
          // into a terminal {error, done:true} chunk, surface here.
          setError(streamErr)
          showCoachStreamError(undefined, streamErr)
          setInput((cur) => cur || trimmed)
          setOptimistic((prev) => prev.filter((m) => m.id !== userMsgId))
        } else {
          // Refetch persisted history so the streaming reply gets a real id.
          await queryClient.invalidateQueries({ queryKey: ['coach', 'chat', scopeKey] })
          setOptimistic([])
        }
      } catch (err) {
        if ((err as any)?.name !== 'AbortError') {
          const m = err instanceof Error ? err.message : 'Chat failed'
          setError(m)
          showCoachStreamError(statusOf(err), m)
          // Restore the user's input so they don't have to retype after a
          // budget/key/network failure, and drop the optimistic bubble.
          setInput((cur) => cur || trimmed)
          setOptimistic((prev) => prev.filter((m) => m.id !== userMsgId))
        }
      } finally {
        setStreaming(false)
        setStreamingReply('')
        abortRef.current = null
      }
    },
    [editingFromMessageId, queryClient, scopeKey, streaming],
  )

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void handleSend(input)
  }

  if (!open) return null

  return (
    <div
      className="fixed bottom-20 right-4 z-50 flex h-[min(560px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
      role="dialog"
      aria-label="Coach quick chat"
    >
      <header className="flex items-center justify-between gap-2 border-b border-zinc-200 bg-gradient-to-br from-[#fffbea] to-white px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f2cc0d]/20 text-[#8a7307]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-zinc-900">Coach</div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">
              Quick chat
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {(persistedMessages.length > 0 || optimistic.length > 0) && (
            <button
              type="button"
              onClick={() => {
                if (!streaming) setConfirmClear(true)
              }}
              title="Start a new chat"
              disabled={streaming}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <Link
            href="/dashboard/coach"
            onClick={onClose}
            title="Open full Coach"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <Maximize2 className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
      >
        {historyQuery.isLoading && allMessages.length === 0 ? (
          <p className="text-xs text-zinc-500">Loading conversation…</p>
        ) : allMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <MessageCircle className="h-7 w-7 text-zinc-300" />
            <p className="max-w-[260px] text-xs text-zinc-500">
              Ask the Coach a quick question. It reads your week, your goals, your check-ins.
            </p>
          </div>
        ) : (
          allMessages.map((m) => (
            <PopoverMessageRow key={m.id} message={m} onEdit={handleEditMessage} />
          ))
        )}
        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
            <CoachErrorText message={error} />
          </div>
        )}
      </div>

      {editingFromMessageId && (
        <div className="flex items-center justify-between gap-2 border-t border-[#f2cc0d]/40 bg-[#fffbea] px-3 py-1.5 text-[11px] text-[#8a7307]">
          <span>
            <span className="font-semibold">Editing.</span> Sending replaces the reply that came after.
          </span>
          <button
            type="button"
            onClick={cancelEdit}
            className="font-medium text-[#8a7307] underline underline-offset-2 hover:text-[#6b5905]"
          >
            Cancel
          </button>
        </div>
      )}
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-zinc-200 bg-white px-3 py-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          disabled={streaming}
          className="h-9 flex-1 rounded-md border border-zinc-200 bg-white px-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d] disabled:opacity-50"
        />
        {streaming ? (
          <button
            type="button"
            onClick={() => {
              abortRef.current?.abort()
              abortRef.current = null
              setStreaming(false)
            }}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            title="Stop"
          >
            <Square className="h-3.5 w-3.5" />
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="inline-flex h-9 items-center gap-1 rounded-md bg-[#f2cc0d] px-2.5 text-xs font-semibold text-zinc-900 shadow-sm hover:bg-[#dfb90c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </button>
        )}
      </form>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Start a new chat?"
        description="This clears this week's chat history. Your accepted practices and narrative stay."
        confirmButtonText="Start new chat"
        cancelButtonText="Keep chat"
        onConfirm={async () => {
          try {
            await coachApi.clearChatHistory(scopeKey)
            setOptimistic([])
            setStreamingReply('')
            setError(null)
            queryClient.setQueryData<CoachMessageDto[]>(['coach', 'chat', scopeKey], [])
            await queryClient.invalidateQueries({ queryKey: ['coach', 'chat', scopeKey] })
            toast.success('New conversation.')
          } catch (err) {
            const m = err instanceof Error ? err.message : 'Could not clear chat'
            toast.error(m)
          }
        }}
      />
    </div>
  )
}

function PopoverMessageRow({
  message,
  onEdit,
}: {
  message: ChatMessageView
  onEdit?: (id: string, content: string) => void
}) {
  const isCoach = message.role === 'ASSISTANT'
  const isUser = !isCoach
  const { cleaned, proposals, pending } = isCoach
    ? extractCoachProposals(message.content || '')
    : { cleaned: message.content, proposals: [], pending: false }

  return (
    <div className="group space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
          {isCoach ? 'Coach' : 'You'}
        </div>
        {isUser && onEdit && !message.pending && !message.id.startsWith('local_user_') && (
          <button
            type="button"
            onClick={() => onEdit(message.id, message.content)}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-400 opacity-70 transition-colors hover:text-[#8a7307] hover:opacity-100"
            title="Edit and resend (removes the reply that came after)"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        )}
      </div>
      {isCoach ? (
        <div className="text-[13px] leading-relaxed text-zinc-900">
          {cleaned && <CoachMarkdown content={cleaned} className="text-[13px]" />}
          {proposals.map((block, idx) => (
            <CoachProposalCard
              key={`${message.id}-prop-${idx}`}
              block={block}
              sourceMessageId={message.id}
            />
          ))}
          {pending && (
            <div className="my-2 flex items-center gap-2 rounded-lg border border-[#f2cc0d]/40 bg-[#fffbea] px-2.5 py-1.5 text-[11px] text-[#8a7307]">
              <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-[#f2cc0d]" />
              Coach is preparing a proposed change…
            </div>
          )}
          {message.pending && !pending && (
            <span className="ml-1 inline-block animate-pulse text-zinc-400">▍</span>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'whitespace-pre-wrap rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[13px] leading-relaxed text-zinc-800',
          )}
        >
          {message.content}
        </div>
      )}
    </div>
  )
}
