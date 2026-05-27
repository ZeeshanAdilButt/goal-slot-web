'use client'

import { useEffect, useRef, useState } from 'react'

import { useCoachChat } from '@/features/reports/hooks/use-coach-chat'
import { Send } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { Input } from '@/components/ui/input'
import { SectionHeader } from '@/components/ui/section-header'

const EXAMPLE_PROMPTS = [
  'Why was Wednesday bad?',
  "Suggest next week's schedule",
  'Where am I leaking time?',
] as const

interface AskTheCoachProps {
  reportPeriodKey: string
}

export function AskTheCoach({ reportPeriodKey }: AskTheCoachProps) {
  const { messages, isReplying, send } = useCoachChat(reportPeriodKey)
  const [draft, setDraft] = useState('')
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [messages.length, isReplying])

  const handleSend = () => {
    if (!draft.trim() || isReplying) return
    send(draft)
    setDraft('')
  }

  return (
    <GlassCard padded className="space-y-4">
      <SectionHeader title="Ask the coach" />

      <div
        ref={threadRef}
        className="space-y-3 max-h-96 overflow-y-auto pr-1 flex flex-col"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <p className="text-sm text-zinc-500">
            Ask anything about this period. The coach references your check-ins, journal, and time data.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              'max-w-[80%] rounded-lg p-3 text-sm whitespace-pre-wrap leading-relaxed',
              m.role === 'user'
                ? 'self-end bg-zinc-50 border border-zinc-200 text-zinc-900'
                : 'self-start bg-zinc-900 text-white',
            )}
          >
            {m.content}
          </div>
        ))}
        {isReplying && (
          <div className="self-start max-w-[80%] rounded-lg p-3 text-sm bg-zinc-900 text-white">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-pulse" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-pulse [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-pulse [animation-delay:240ms]" />
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {EXAMPLE_PROMPTS.map((p) => (
          <Button
            key={p}
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setDraft(p)}
            disabled={isReplying}
          >
            {p}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Ask the coach..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          disabled={isReplying}
          className="flex-1"
        />
        <Button variant="default" onClick={handleSend} disabled={isReplying || !draft.trim()}>
          <Send className="h-4 w-4" />
          Send
        </Button>
      </div>
    </GlassCard>
  )
}
