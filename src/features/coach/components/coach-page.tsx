'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Bookmark, BookmarkCheck, KeyRound, MessageCircle, Pencil, RotateCcw, Send, Settings as SettingsIcon, Sparkles, Square, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { coachApi, type CoachMessageDto, type CoachStreamChunk } from '@/lib/api'
import { cn } from '@/lib/utils'
import { PROVIDER_META, useByokKey } from '@/features/settings/hooks/use-byok-key'
import { useCoachInsights } from '@/features/coach/hooks/use-coach-insights'
import { ActivePracticeSection } from '@/features/coach/components/active-practice-section'
import { CoachMarkdown } from '@/features/coach/components/coach-markdown'
import { CoachOverviewTiles } from '@/features/coach/components/coach-overview-tiles'
import {
  CoachProposalCard,
  extractCoachProposals,
} from '@/features/coach/components/coach-proposal-card'
import { InsightCard } from '@/features/coach/components/insight-card'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { GlassCard } from '@/components/ui/glass-card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { PageShell } from '@/components/ui/page-shell'
import { SectionHeader } from '@/components/ui/section-header'
import { SocraticQuote } from '@/components/ui/socratic-quote'

const EXAMPLE_PROMPTS = [
  'Suggest an active practice',
  'Add to my schedule',
  'Edit my schedule',
  'Log time for...',
  'Why was Wednesday bad?',
  'Where am I leaking time?',
]

// ---------------------------------------------------------------------------
// scopeKey helpers — supports week ("YYYY-Www"), month ("YYYY-Mmm"),
// quarter ("YYYY-Qq"), and year ("YYYY"). Backend parses all four shapes
// into a date range the context bundle aggregates against.
// ---------------------------------------------------------------------------
export type CoachScopePeriod = 'week' | 'month' | 'quarter' | 'year'

function currentScopeKey(period: CoachScopePeriod = 'week'): string {
  const now = new Date()
  if (period === 'week') {
    const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    const dayNum = date.getUTCDay() || 7
    date.setUTCDate(date.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
    const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
  }
  if (period === 'month') {
    return `${now.getFullYear()}-M${String(now.getMonth() + 1).padStart(2, '0')}`
  }
  if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3) + 1
    return `${now.getFullYear()}-Q${q}`
  }
  return `${now.getFullYear()}`
}

/**
 * Human label for a scopeKey. Returns "This week · May 25 – 31" for the current
 * ISO week, or "May 18 – 24, 2026" for a past one. Falls back to the raw
 * scopeKey only when the parse fails.
 */
function humanScopeLabel(scopeKey: string): string {
  // Week
  let m: RegExpExecArray | null = /^(\d{4})-W(\d{2})$/.exec(scopeKey)
  if (m) {
    const year = Number(m[1])
    const week = Number(m[2])
    const jan4 = new Date(Date.UTC(year, 0, 4))
    const jan4Day = jan4.getUTCDay() || 7
    const week1Monday = new Date(jan4)
    week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1))
    const monday = new Date(week1Monday)
    monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7)
    const sunday = new Date(monday)
    sunday.setUTCDate(monday.getUTCDate() + 6)
    const fmtDay = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const fmtSundayDay = (d: Date) =>
      d.getUTCMonth() === monday.getUTCMonth() ? String(d.getUTCDate()) : fmtDay(d)
    const isCurrent = scopeKey === currentScopeKey('week')
    return `${isCurrent ? 'This week · ' : ''}${fmtDay(monday)} - ${fmtSundayDay(sunday)}`
  }
  // Month
  m = /^(\d{4})-M(\d{2})$/.exec(scopeKey)
  if (m) {
    const date = new Date(Number(m[1]), Number(m[2]) - 1, 1)
    const label = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    return scopeKey === currentScopeKey('month') ? `This month · ${label}` : label
  }
  // Quarter
  m = /^(\d{4})-Q([1-4])$/.exec(scopeKey)
  if (m) {
    const label = `Q${m[2]} ${m[1]}`
    return scopeKey === currentScopeKey('quarter') ? `This quarter · ${label}` : label
  }
  // Year
  if (/^\d{4}$/.test(scopeKey)) {
    return scopeKey === currentScopeKey('year') ? `This year · ${scopeKey}` : scopeKey
  }
  return scopeKey
}

function isAxios404(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 404
}

function statusOf(err: unknown): number | undefined {
  if (axios.isAxiosError(err)) return err.response?.status
  if (err && typeof err === 'object' && 'status' in err) {
    const s = (err as { status?: unknown }).status
    if (typeof s === 'number') return s
  }
  return undefined
}

import { CoachErrorText, showCoachStreamError } from '@/features/coach/utils/stream-error-toast'

function handleStreamError(status: number | undefined, message: string) {
  showCoachStreamError(status, message)
}

// ---------------------------------------------------------------------------
// Narrative
// ---------------------------------------------------------------------------
interface NarrativeSectionProps {
  scopeKey: string
}

export function NarrativeSection({ scopeKey }: NarrativeSectionProps) {
  const queryClient = useQueryClient()

  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [usage, setUsage] = useState<{ promptTokens: number; completionTokens: number } | null>(null)
  const [streamError, setStreamError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Cached narrative (404 means none yet — that's fine, we render a prompt).
  const cachedQuery = useQuery<CoachMessageDto | null>({
    queryKey: ['coach', 'narrative', scopeKey],
    queryFn: async () => {
      try {
        const res = await coachApi.getNarrative(scopeKey)
        return res.data
      } catch (err) {
        if (isAxios404(err)) return null
        throw err
      }
    },
  })

  const runStream = useCallback(
    async (opts: { force: boolean }) => {
      if (isStreaming) return
      // Cancel any in-flight stream just in case.
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setIsStreaming(true)
      setStreamingText('')
      setStreamError(null)
      setUsage(null)
      try {
        const iter = await coachApi.streamNarrative(scopeKey, {
          force: opts.force,
          signal: controller.signal,
        })
        let acc = ''
        let lastUsage: CoachStreamChunk['usage'] | undefined
        let lastError: string | undefined
        let sawDone = false
        for await (const chunk of iter) {
          if (chunk.delta) {
            acc += chunk.delta
            setStreamingText(acc)
          }
          if (chunk.usage) lastUsage = chunk.usage
          if (chunk.error) lastError = chunk.error
          if (chunk.done) {
            sawDone = true
            break
          }
        }
        if (lastError) {
          setStreamError(lastError)
        } else {
          // Persist as the cached narrative.
          if (acc) {
            queryClient.setQueryData<CoachMessageDto | null>(['coach', 'narrative', scopeKey], (prev) => ({
              id: prev?.id ?? `local_${Date.now()}`,
              scopeKey,
              role: 'SYSTEM_NARRATIVE',
              content: acc,
              promptTokens: lastUsage?.promptTokens ?? null,
              completionTokens: lastUsage?.completionTokens ?? null,
              model: prev?.model ?? null,
              createdAt: new Date().toISOString(),
            }))
          }
          if (lastUsage) setUsage(lastUsage)
        }
        if (sawDone) {
          // Server-side extraction runs async after the stream closes (~1.5s).
          // Pull fresh insights so the NewSuggestionsSection picks them up.
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['coach', 'insights'] })
          }, 2000)
        }
      } catch (err) {
        const status = statusOf(err)
        const message = err instanceof Error ? err.message : 'Failed to generate narrative'
        handleStreamError(status, message)
        setStreamError(message)
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [isStreaming, queryClient, scopeKey],
  )

  // Cancel stream on unmount.
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const cached = cachedQuery.data
  const displayText = isStreaming || streamingText ? streamingText : cached?.content ?? ''
  const hasContent = displayText.length > 0
  const isLoadingCache = cachedQuery.isLoading

  return (
    <GlassCard padded className="space-y-3">
      <SectionHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Your week, in narrative
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Badge variant="default">{humanScopeLabel(scopeKey)}</Badge>
            {isStreaming && <Badge variant="brand">Streaming...</Badge>}
          </div>
        }
      />

      {isLoadingCache && !hasContent && (
        <p className="text-sm text-zinc-500">Loading the latest narrative...</p>
      )}

      {!isLoadingCache && !hasContent && !isStreaming && !streamError && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-600">
            No narrative for this week yet. Generate one to read a plain-English review of how your week went,
            plus a Socratic question to keep you honest.
          </p>
          <Button variant="brand" size="sm" onClick={() => runStream({ force: false })}>
            <Sparkles className="h-3.5 w-3.5" />
            Generate this week&apos;s narrative
          </Button>
        </div>
      )}

      {hasContent && (
        <SocraticQuote>
          <div className="not-italic text-zinc-800">
            <CoachMarkdown content={displayText} className="text-[15px] text-zinc-800" />
            {isStreaming && <span className="ml-1 animate-pulse text-zinc-400">▍</span>}
          </div>
        </SocraticQuote>
      )}

      {usage && !isStreaming && (
        <p className="text-[11px] text-zinc-500">
          {usage.promptTokens} prompt + {usage.completionTokens} completion tokens
        </p>
      )}

      {streamError && (
        <div className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-700">
          <CoachErrorText message={streamError} />
        </div>
      )}

      {hasContent && (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => runStream({ force: true })}
            disabled={isStreaming}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Regenerate
          </Button>
        </div>
      )}
    </GlassCard>
  )
}

// ---------------------------------------------------------------------------
// New suggestions (fresh PROPOSED insights for this week)
// ---------------------------------------------------------------------------
interface NewSuggestionsSectionProps {
  scopeKey: string
}

function NewSuggestionsSection({ scopeKey }: NewSuggestionsSectionProps) {
  const { insights, updateStatus } = useCoachInsights('ACTIVE')
  const fresh = insights.filter(
    (i) => i.status === 'PROPOSED' && i.scopeKey === scopeKey,
  )
  if (fresh.length === 0) return null
  return (
    <GlassCard padded className="space-y-3">
      <SectionHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            New suggestions from this week
          </span>
        }
      />
      <div className="space-y-3">
        {fresh.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onUpdate={(s) => updateStatus(insight.id, s)}
          />
        ))}
      </div>
    </GlassCard>
  )
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------
interface ChatMessageView {
  id: string
  role: 'USER' | 'ASSISTANT' | 'SYSTEM_NARRATIVE'
  content: string
  pending?: boolean
}

/**
 * One row in the chat thread. Coach replies that are real persisted messages
 * (not optimistic or in-flight) get a "Save as reminder" button — clicking
 * it turns the reply into an ACCEPTED CoachInsight that lands in the
 * Dashboard reminders + Settings Active practice surfaces.
 */
function ChatMessageRow({
  message,
  scopeKey,
  savedIds,
  onSaved,
  onEdit,
}: {
  message: ChatMessageView
  scopeKey: string
  savedIds: Set<string>
  onSaved: (id: string) => void
  onEdit?: (id: string, content: string) => void
}) {
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const isCoach = message.role === 'ASSISTANT'
  const isPersisted = isCoach && !message.pending && !message.id.startsWith('streaming-')
  const isSaved = savedIds.has(message.id)

  const handleSave = useCallback(async () => {
    if (!isPersisted || saving || isSaved) return
    setSaving(true)
    try {
      await coachApi.saveChatMessageAsInsight(scopeKey, message.id)
      onSaved(message.id)
      await queryClient.invalidateQueries({ queryKey: ['coach', 'insights'] })
      toast.success('Saved as a reminder. Open Dashboard or Coach Profile to see it.')
    } catch (err) {
      const m = err instanceof Error ? err.message : 'Could not save'
      toast.error(m)
    } finally {
      setSaving(false)
    }
  }, [isPersisted, isSaved, message.id, onSaved, queryClient, saving, scopeKey])

  const isUser = message.role === 'USER'
  return (
    <div className="group space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
          {isUser ? 'You' : 'Coach'}
        </span>
        {isUser && onEdit && !message.pending && !message.id.startsWith('local_user_') && (
          <button
            type="button"
            onClick={() => onEdit(message.id, message.content)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 opacity-70 transition-colors hover:text-[#8a7307] hover:opacity-100 focus-visible:opacity-100"
            title="Edit and resend (removes the reply that came after)"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        )}
        {isPersisted &&
          (isSaved ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8a7307]">
              <BookmarkCheck className="h-3.5 w-3.5" />
              Saved
            </span>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 opacity-70 transition-opacity hover:text-[#8a7307] hover:opacity-100 focus-visible:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
              title="Save this reply as a reminder"
            >
              <Bookmark className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Save as reminder'}
            </button>
          ))}
      </div>
      {message.role === 'ASSISTANT' ? (
        (() => {
          const { cleaned, proposals, pending } = extractCoachProposals(message.content || '')
          return (
            <div className="text-[15px] leading-relaxed text-zinc-900">
              {cleaned && <CoachMarkdown content={cleaned} />}
              {proposals.map((block, idx) => (
                <CoachProposalCard
                  key={`${message.id}-prop-${idx}`}
                  block={block}
                  sourceMessageId={message.id}
                />
              ))}
              {pending && (
                <div className="my-3 flex items-center gap-2 rounded-lg border border-[#f2cc0d]/40 bg-[#fffbea] px-3 py-2 text-xs text-[#8a7307]">
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-[#f2cc0d]" />
                  Coach is preparing a proposed change...
                </div>
              )}
              {message.pending && !pending && (
                <span className="ml-1 inline-block animate-pulse text-zinc-400">▍</span>
              )}
            </div>
          )
        })()
      ) : (
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-700">
          {message.content}
        </div>
      )}
    </div>
  )
}

interface ChatSectionProps {
  scopeKey: string
}

function ChatSection({ scopeKey }: ChatSectionProps) {
  const queryClient = useQueryClient()

  const historyQuery = useQuery<CoachMessageDto[]>({
    queryKey: ['coach', 'chat', scopeKey],
    queryFn: async () => {
      const res = await coachApi.getChatHistory(scopeKey)
      return res.data ?? []
    },
  })

  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [optimistic, setOptimistic] = useState<ChatMessageView[]>([])
  const [streamingReply, setStreamingReply] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [confirmClear, setConfirmClear] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter chat-relevant messages (exclude narratives so the chat thread is clean).
  const persistedMessages = useMemo<ChatMessageView[]>(() => {
    return (historyQuery.data ?? [])
      .filter((m) => m.role === 'USER' || m.role === 'ASSISTANT')
      .map((m) => ({ id: m.id, role: m.role, content: m.content }))
  }, [historyQuery.data])

  const allMessages = useMemo<ChatMessageView[]>(() => {
    const list = [...persistedMessages, ...optimistic]
    if (streaming && streamingReply) {
      list.push({ id: 'streaming-assistant', role: 'ASSISTANT', content: streamingReply, pending: true })
    } else if (streaming) {
      list.push({ id: 'streaming-assistant', role: 'ASSISTANT', content: '...', pending: true })
    }
    return list
  }, [persistedMessages, optimistic, streaming, streamingReply])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [allMessages.length, streamingReply])

  // Do NOT abort the SSE on unmount. If the user navigates away mid-reply we
  // want the server to finish and persist the message, so the next visit just
  // shows the answer. Only the explicit Stop button aborts.

  // When the user is editing an older message, send() will first truncate
  // the chat from that message onward (server + cache) so the new turn
  // replaces the stale reply chain. Saves tokens and prevents Coach from
  // contradicting itself.
  const [editingFromMessageId, setEditingFromMessageId] = useState<string | null>(null)

  const handleEditMessage = useCallback((id: string, content: string) => {
    setEditingFromMessageId(id)
    setInput(content)
    inputRef.current?.focus()
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingFromMessageId(null)
    setInput('')
  }, [])

  const handleSend = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || streaming) return
      setError(null)
      setInput('')

      // If this send is an edit of an older message, truncate the chat at
      // that message (server + cache) so the previous turn-and-reply chain
      // is gone. Then proceed with a fresh send.
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
      setOptimistic((prev) => [...prev, { id: userMsgId, role: 'USER', content: trimmed }])
      setStreamingReply('')
      setStreaming(true)
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const iter = await coachApi.streamChat(scopeKey, trimmed, { signal: controller.signal })
        let acc = ''
        let streamErr: string | undefined
        for await (const chunk of iter) {
          if (chunk.delta) {
            acc += chunk.delta
            setStreamingReply(acc)
          }
          if (chunk.error) streamErr = chunk.error
          if (chunk.done) break
        }
        if (streamErr) {
          // Stream completed with an error (budget exceeded, key removed, etc.
          // surfaces here instead of via throw because the SSE bridge wraps
          // backend throws into a terminal {error, done:true} chunk).
          handleStreamError(undefined, streamErr)
          setError(streamErr)
          // Restore the user's typed text and drop the optimistic bubble so
          // they can fix-and-retry without retyping.
          setInput((cur) => cur || trimmed)
          setOptimistic((prev) => prev.filter((m) => m.id !== userMsgId))
        } else {
          // Invalidate history so we get authoritative IDs/timestamps; drop optimistic.
          await queryClient.invalidateQueries({ queryKey: ['coach', 'chat', scopeKey] })
          setOptimistic([])
        }
      } catch (err) {
        const status = statusOf(err)
        const message = err instanceof Error ? err.message : 'Chat failed'
        handleStreamError(status, message)
        setError(message)
        // Send failed (budget exceeded, key removed, network, etc). Restore
        // what the user wrote so they don't have to retype, and drop the
        // optimistic user bubble so we don't leave a ghost message in chat.
        setInput((cur) => cur || trimmed)
        setOptimistic((prev) => prev.filter((m) => m.id !== userMsgId))
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

  const performClearChat = useCallback(async () => {
    try {
      await coachApi.clearChatHistory(scopeKey)
      setOptimistic([])
      setStreamingReply('')
      setError(null)
      queryClient.setQueryData<CoachMessageDto[]>(['coach', 'chat', scopeKey], [])
      await queryClient.invalidateQueries({ queryKey: ['coach', 'chat', scopeKey] })
      toast.success('New conversation. The Coach still remembers your data and accepted insights.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not clear chat'
      toast.error(message)
    }
  }, [queryClient, scopeKey])

  const handleClearChat = useCallback(() => {
    if (streaming) return
    const hasMessages = persistedMessages.length > 0 || optimistic.length > 0
    if (hasMessages) {
      setConfirmClear(true)
    } else {
      void performClearChat()
    }
  }, [optimistic.length, performClearChat, persistedMessages.length, streaming])

  return (
    <GlassCard padded className="space-y-3">
      <SectionHeader
        title={
          <span className="inline-flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Ask the Coach
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Badge variant="default">{humanScopeLabel(scopeKey)}</Badge>
            {(persistedMessages.length > 0 || optimistic.length > 0) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                disabled={streaming}
                title="Clear chat and start a new conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
                New
              </Button>
            )}
          </div>
        }
      />

      <div
        ref={scrollRef}
        className="max-h-[420px] min-h-[180px] space-y-3 overflow-y-auto rounded-lg border border-zinc-100 bg-white/40 p-3"
      >
        {historyQuery.isLoading && allMessages.length === 0 ? (
          <p className="text-sm text-zinc-500">Loading conversation...</p>
        ) : allMessages.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nothing here yet. Ask what you actually want to know, about your week, your sleep,
            why something is hard, or what to try next.
          </p>
        ) : (
          <div className="space-y-5">
            {allMessages.map((m) => (
              <ChatMessageRow
                key={m.id}
                message={m}
                scopeKey={scopeKey}
                savedIds={savedIds}
                onSaved={(id) => setSavedIds((prev) => new Set(prev).add(id))}
                onEdit={handleEditMessage}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setInput(p)}
            disabled={streaming}
            className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[12px] text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>

      {editingFromMessageId && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-[#f2cc0d]/40 bg-[#fffbea] px-3 py-1.5 text-xs text-[#8a7307]">
          <span>
            <span className="font-semibold">Editing.</span> Sending will replace this message and
            remove the reply that came after it.
          </span>
          <button
            type="button"
            onClick={cancelEdit}
            className="text-xs font-medium text-[#8a7307] underline underline-offset-2 hover:text-[#6b5905]"
          >
            Cancel
          </button>
        </div>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {(persistedMessages.length > 0 || optimistic.length > 0) && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClearChat}
            disabled={streaming}
            title="Start a new chat (clears this week's history)"
            aria-label="Start a new chat"
            className="shrink-0 text-zinc-500 hover:text-[#8a7307]"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={editingFromMessageId ? 'Edit your message...' : 'Ask the Coach a question...'}
          disabled={streaming}
          className="flex-1"
        />
        {streaming ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              abortRef.current?.abort()
              abortRef.current = null
              setStreaming(false)
            }}
            title="Stop the Coach mid-reply"
          >
            <Square className="h-3.5 w-3.5" />
            Stop
          </Button>
        ) : (
          <Button type="submit" variant="brand" disabled={!input.trim()}>
            <Send className="h-3.5 w-3.5" />
            Send
          </Button>
        )}
      </form>

      {error && (
        <p className="text-xs text-rose-600" role="alert">
          <CoachErrorText message={error} />
        </p>
      )}

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Start a new chat?"
        description="This clears this week's chat history. Your accepted practices and narrative stay."
        confirmButtonText="Start new chat"
        cancelButtonText="Keep chat"
        onConfirm={performClearChat}
      />
    </GlassCard>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export function CoachPage() {
  const { status, provider, isResolved, shared } = useByokKey()
  const hasKey = status === 'active'
  // Shared free-tier fallback: even without a personal key, the user
  // can chat with the Coach using the operator-provided Gemini Flash
  // key, gated by a per-user daily message count. When this is
  // available we treat the Coach as "usable" so the chat / overview
  // surfaces still render. They still get pushed toward adding their
  // own key via a soft banner once the daily quota gets low.
  const sharedAvailable = shared?.available ?? false
  const sharedRemaining = sharedAvailable
    ? Math.max(0, (shared?.limit ?? 0) - (shared?.used ?? 0))
    : 0
  const coachUsable = hasKey || sharedAvailable
  const showNoKey = isResolved && !coachUsable
  const providerLabel = PROVIDER_META[provider].label

  const [period, setPeriod] = useState<CoachScopePeriod>('week')
  const [scopeKey, setScopeKey] = useState('')
  useEffect(() => {
    setScopeKey(currentScopeKey(period))
  }, [period])

  const PERIODS: { key: CoachScopePeriod; label: string }[] = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'quarter', label: 'Quarter' },
    { key: 'year', label: 'Year' },
  ]

  return (
    <PageShell>
      <PageHeader
        title="Coach"
        eyebrow="Insights"
        description="Your Socratic productivity coach. Reads your goals, time, schedule, check-ins, journal, and Habits Profile to surface patterns and ask the questions that matter."
      />

      {/* Scope picker + Coach-level actions (status badge + Train Coach)
          on a single row. The badge / Train Coach used to live in the
          PageHeader but pushed below on wide descriptions; this places
          them right next to the context filters so they're always
          on-screen at the same height. */}
      {coachUsable && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Context
          </span>
          <div className="inline-flex rounded-md border border-zinc-200 bg-white p-0.5 shadow-sm">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                  period === p.key
                    ? 'bg-[#f2cc0d] text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-50',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          {scopeKey && (
            <span className="text-[11px] text-zinc-500">{humanScopeLabel(scopeKey)}</span>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {hasKey ? (
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-zinc-900 bg-zinc-900 px-2.5 text-[11px] font-semibold tracking-tight text-white">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#f2cc0d]" />
                {providerLabel}
                <span aria-hidden className="text-zinc-500">·</span>
                <span className="text-[#f2cc0d]">Connected</span>
              </span>
            ) : (
              // Shared free-tier badge with remaining-message meter so
              // the user always knows how many shared messages they
              // have left today before being asked to add their own key.
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 text-[11px] font-semibold tracking-tight text-emerald-800">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Free trial
                <span aria-hidden className="text-emerald-400">·</span>
                <span>
                  {sharedRemaining} of {shared?.limit ?? 0} left today
                </span>
              </span>
            )}
            <Link href="/dashboard/settings?tab=coach-profile">
              <Button variant="secondary" size="sm">
                <SettingsIcon className="h-3.5 w-3.5" />
                Train Coach
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* When the user is on the shared free trial, a soft banner pushes
          them toward adding their own key. The push gets louder as the
          daily quota runs out. */}
      {!hasKey && sharedAvailable && (
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2 text-[12px]',
            sharedRemaining <= 3
              ? 'border-amber-300 bg-amber-50 text-amber-900'
              : 'border-zinc-200 bg-zinc-50 text-zinc-700',
          )}
        >
          <span>
            <span className="font-semibold">
              {sharedRemaining > 0
                ? `You're on the free shared trial.`
                : `Daily free trial is used up for today.`}
            </span>{' '}
            {sharedRemaining > 0
              ? `${sharedRemaining} of ${shared?.limit ?? 0} messages left today, then it resets at midnight UTC. Add your own free Gemini or OpenRouter key for unlimited usage.`
              : `It resets at midnight UTC. Add your own free Gemini or OpenRouter key now to keep going without waiting.`}
          </span>
          <Link href="/dashboard/settings?tab=integrations">
            <Button variant="brand" size="sm">
              Add my own key
            </Button>
          </Link>
        </div>
      )}
      {showNoKey && (
        <div className="flex items-center justify-end">
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-2.5 text-[11px] font-semibold tracking-tight text-zinc-700">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
            Not configured
          </span>
        </div>
      )}

      {/* Compact tiles row: capabilities, narrative, active practice — collapsed by default to keep chat front-and-center. */}
      {coachUsable && scopeKey && <CoachOverviewTiles scopeKey={scopeKey} />}

      {showNoKey && (
        <GlassCard padded>
          <EmptyState
            icon={<KeyRound />}
            title="Connect a key to unlock the Coach"
            description={
              <>
                The Coach runs on a key you bring from one of four providers. Two of them are free,
                no credit card needed: Google Gemini and OpenRouter. The other two (OpenAI and
                Anthropic) bill straight to your own provider account. Whichever you pick, the key
                is encrypted server side and only used for your requests.
              </>
            }
            action={
              <Link href="/dashboard/settings?tab=integrations">
                <Button variant="brand">Open Integrations</Button>
              </Link>
            }
          />
        </GlassCard>
      )}

      {coachUsable && scopeKey && (
        <>
          <NewSuggestionsSection scopeKey={scopeKey} />
          <ChatSection scopeKey={scopeKey} />
        </>
      )}
    </PageShell>
  )
}
