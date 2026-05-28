'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Bookmark, BookmarkCheck, KeyRound, MessageCircle, RotateCcw, Send, Settings as SettingsIcon, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { coachApi, type CoachMessageDto, type CoachStreamChunk } from '@/lib/api'
import { cn } from '@/lib/utils'
import { PROVIDER_META, useByokKey } from '@/features/settings/hooks/use-byok-key'
import { useCoachInsights } from '@/features/coach/hooks/use-coach-insights'
import { ActivePracticeSection } from '@/features/coach/components/active-practice-section'
import { InsightCard } from '@/features/coach/components/insight-card'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { GlassCard } from '@/components/ui/glass-card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { PageShell } from '@/components/ui/page-shell'
import { SectionHeader } from '@/components/ui/section-header'
import { SocraticQuote } from '@/components/ui/socratic-quote'

const EXAMPLE_PROMPTS = [
  'Why was Wednesday bad?',
  "Suggest next week's schedule",
  'Where am I leaking time?',
]

// ---------------------------------------------------------------------------
// scopeKey helpers — ISO week "YYYY-Www" (matches backend & use-goal-reflection)
// ---------------------------------------------------------------------------
function currentScopeKey(): string {
  const now = new Date()
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

/**
 * Human label for a scopeKey. Returns "This week · May 25 – 31" for the current
 * ISO week, or "May 18 – 24, 2026" for a past one. Falls back to the raw
 * scopeKey only when the parse fails.
 */
function humanScopeLabel(scopeKey: string): string {
  const m = /^(\d{4})-W(\d{2})$/.exec(scopeKey)
  if (!m) return scopeKey
  const year = Number(m[1])
  const week = Number(m[2])
  // ISO-week Monday: Jan 4 of the year is always in week 1; back up to its Monday.
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
  const isCurrent = scopeKey === currentScopeKey()
  const prefix = isCurrent ? 'This week · ' : ''
  return `${prefix}${fmtDay(monday)} – ${fmtSundayDay(sunday)}`
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

function handleStreamError(status: number | undefined, message: string) {
  if (status === 412) {
    toast.error('Your API key was removed. Reconnect it in Integrations.')
  } else if (status === 429) {
    toast.error('Rate limit hit — try again later or check your token budget.')
  } else {
    toast.error(message)
  }
}

// ---------------------------------------------------------------------------
// Narrative
// ---------------------------------------------------------------------------
interface NarrativeSectionProps {
  scopeKey: string
}

function NarrativeSection({ scopeKey }: NarrativeSectionProps) {
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
            {isStreaming && <Badge variant="brand">Streaming…</Badge>}
          </div>
        }
      />

      {isLoadingCache && !hasContent && (
        <p className="text-sm text-zinc-500">Loading the latest narrative…</p>
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
          <span className="whitespace-pre-wrap not-italic text-zinc-800">{displayText}</span>
          {isStreaming && <span className="ml-1 animate-pulse text-zinc-400">▍</span>}
        </SocraticQuote>
      )}

      {usage && !isStreaming && (
        <p className="text-[11px] text-zinc-500">
          {usage.promptTokens} prompt + {usage.completionTokens} completion tokens
        </p>
      )}

      {streamError && (
        <Badge variant="destructive" className="normal-case">
          {streamError}
        </Badge>
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
}: {
  message: ChatMessageView
  scopeKey: string
  savedIds: Set<string>
  onSaved: (id: string) => void
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

  return (
    <div className="group space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
          {message.role === 'USER' ? 'You' : 'Coach'}
        </span>
        {isPersisted &&
          (isSaved ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
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
              {saving ? 'Saving…' : 'Save as reminder'}
            </button>
          ))}
      </div>
      <div
        className={cn(
          'whitespace-pre-wrap text-[15px] leading-relaxed',
          message.role === 'USER' ? 'text-zinc-700' : 'text-zinc-900',
        )}
      >
        {message.content}
        {message.pending && message.role === 'ASSISTANT' && (
          <span className="ml-1 animate-pulse text-zinc-400">▍</span>
        )}
      </div>
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
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

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
      list.push({ id: 'streaming-assistant', role: 'ASSISTANT', content: '…', pending: true })
    }
    return list
  }, [persistedMessages, optimistic, streaming, streamingReply])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [allMessages.length, streamingReply])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const handleSend = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || streaming) return
      setError(null)
      setInput('')
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
          setError(streamErr)
        }
        // Invalidate history so we get authoritative IDs/timestamps; drop optimistic.
        await queryClient.invalidateQueries({ queryKey: ['coach', 'chat', scopeKey] })
        setOptimistic([])
      } catch (err) {
        const status = statusOf(err)
        const message = err instanceof Error ? err.message : 'Chat failed'
        handleStreamError(status, message)
        setError(message)
        // Keep the optimistic user message visible so the user can retry.
      } finally {
        setStreaming(false)
        setStreamingReply('')
        abortRef.current = null
      }
    },
    [queryClient, scopeKey, streaming],
  )

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void handleSend(input)
  }

  const handleClearChat = useCallback(async () => {
    if (streaming) return
    const hasMessages = persistedMessages.length > 0 || optimistic.length > 0
    if (
      hasMessages &&
      typeof window !== 'undefined' &&
      !window.confirm(
        'Start a new conversation? Your chat history for this week will be cleared. Accepted insights + narrative stay.',
      )
    ) {
      return
    }
    try {
      await coachApi.clearChatHistory(scopeKey)
      setOptimistic([])
      setStreamingReply('')
      setError(null)
      queryClient.setQueryData<CoachMessageDto[]>(['coach', 'chat', scopeKey], [])
      await queryClient.invalidateQueries({ queryKey: ['coach', 'chat', scopeKey] })
      toast.success('New conversation. The Coach still remembers your data + accepted insights.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not clear chat'
      toast.error(message)
    }
  }, [optimistic.length, persistedMessages.length, queryClient, scopeKey, streaming])

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
          <p className="text-sm text-zinc-500">Loading conversation…</p>
        ) : allMessages.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nothing here yet. Ask what you actually want to know — about your week, your sleep,
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

      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the Coach a question…"
          disabled={streaming}
          className="flex-1"
        />
        <Button type="submit" variant="brand" disabled={streaming || !input.trim()}>
          <Send className="h-3.5 w-3.5" />
          {streaming ? 'Thinking…' : 'Send'}
        </Button>
      </form>

      {error && (
        <p className="text-xs text-rose-600" role="alert">
          {error}
        </p>
      )}
    </GlassCard>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export function CoachPage() {
  const { status, provider } = useByokKey()
  const hasKey = status === 'active'
  const providerLabel = PROVIDER_META[provider].label

  const [scopeKey, setScopeKey] = useState('')
  useEffect(() => {
    setScopeKey(currentScopeKey())
  }, [])

  return (
    <PageShell>
      <PageHeader
        title="Coach"
        eyebrow="Insights"
        description="Your Socratic productivity coach — reads your goals, time, schedule, check-ins, journal, and Habits Profile to surface patterns and ask the questions that matter."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {hasKey ? (
              <Badge variant="success">{providerLabel} · Connected</Badge>
            ) : (
              <Badge variant="default">Not configured</Badge>
            )}
            <Link href="/dashboard/settings?tab=coach-profile">
              <Button variant="secondary" size="sm">
                <SettingsIcon className="h-3.5 w-3.5" />
                Train Coach
              </Button>
            </Link>
          </div>
        }
      />

      {/* What the Coach can do — quick capability primer at the top of every visit. */}
      <GlassCard padded>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          What the Coach can do
        </h2>
        <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm text-zinc-700 sm:grid-cols-2">
          <li className="flex items-start gap-2">
            <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f2cc0d]" />
            <span>Read your week (time entries, schedule, check-ins, journal, goals) and write you a plain-English narrative.</span>
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f2cc0d]" />
            <span>Surface 1–5 concrete suggestions from each narrative — observations, experiments, media to consume.</span>
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f2cc0d]" />
            <span>Remember the suggestions you accept and reference them by name in future narratives + chats.</span>
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f2cc0d]" />
            <span>Answer questions with citations from <em>your</em> data — never generic productivity advice.</span>
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f2cc0d]" />
            <span>Save any chat reply as a tracked reminder (Bookmark icon in the conversation).</span>
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            <span>
              Runs on <span className="font-medium text-zinc-900">your</span> OpenAI or Anthropic key —
              we encrypt it server-side with AES-256-GCM, never log it, never share it, and you can
              remove it anytime from Settings → Integrations.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
            <span className="text-zinc-500">
              <span className="font-medium text-zinc-600">Coming soon:</span> propose schedule + goal edits for your approval (you stay in control of every change).
            </span>
          </li>
        </ul>
      </GlassCard>

      {!hasKey && (
        <GlassCard padded>
          <EmptyState
            icon={<KeyRound />}
            title="Connect a key to unlock the Coach"
            description={
              <>
                The Coach runs on your own OpenAI or Anthropic API key. We encrypt it server-side and
                use it only for your requests — charges go straight to your provider. Add a key in
                Settings → Integrations to start.
              </>
            }
            action={
              <Link href="/dashboard/settings?tab=integrations">
                <Button variant="brand">Open Integrations →</Button>
              </Link>
            }
          />
        </GlassCard>
      )}

      {hasKey && scopeKey && (
        <>
          <NarrativeSection scopeKey={scopeKey} />
          <NewSuggestionsSection scopeKey={scopeKey} />
          <ActivePracticeSection />
          <ChatSection scopeKey={scopeKey} />
        </>
      )}
    </PageShell>
  )
}
