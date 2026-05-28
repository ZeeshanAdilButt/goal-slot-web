'use client'

import { useState } from 'react'
import Link from 'next/link'

import { useCoachInsights } from '@/features/coach/hooks/use-coach-insights'
import { Brain, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { SectionHeader } from '@/components/ui/section-header'

/**
 * Dashboard reminder card — surfaces accepted + currently-doing Coach
 * insights so the user is reminded of what they've committed to every time
 * they open the app. Mark Done / Pause inline so the surface stays a
 * working reminder, not a passive list.
 *
 * Renders null when there is nothing to remind about (no accepted insights
 * yet) so the dashboard doesn't grow an empty card.
 */
export function ActivePracticeReminders() {
  const { insights, isLoaded, updateStatus } = useCoachInsights('ACTIVE')
  const [expanded, setExpanded] = useState(false)

  // Only show insights the user has actually opted into — PROPOSED items
  // live on the Coach page; this card is "what I am working on".
  const reminders = insights.filter((i) => i.status === 'ACCEPTED' || i.status === 'DOING')
  if (!isLoaded || reminders.length === 0) return null

  const COLLAPSED_COUNT = 3
  const visible = expanded ? reminders : reminders.slice(0, COLLAPSED_COUNT)
  const hiddenCount = reminders.length - visible.length

  return (
    <GlassCard padded>
      <SectionHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Brain className="h-4 w-4" />
            What you&apos;re working on
          </span>
        }
        action={
          <Badge variant="brand">
            {reminders.length} {reminders.length === 1 ? 'reminder' : 'reminders'}
          </Badge>
        }
      />

      <p className="-mt-1 mb-3 text-xs text-zinc-500">
        The Coach&apos;s suggestions you accepted. Mark them done as you build the habit, or pause if
        they need to wait.
      </p>

      <ul className="space-y-2">
        {visible.map((insight) => (
          <li
            key={insight.id}
            className="group flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 transition-colors hover:border-zinc-300 sm:flex-row sm:items-center sm:gap-3"
          >
            <span
              className={cn(
                'inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[10px] font-semibold uppercase tracking-wider',
                insight.status === 'DOING'
                  ? 'bg-[#f2cc0d]/15 text-[#8a7307]'
                  : 'bg-emerald-50 text-emerald-700',
              )}
            >
              {insight.status === 'DOING' ? 'Doing' : 'Accepted'}
            </span>
            <span className="flex-1 text-sm font-medium text-zinc-900">{insight.title}</span>
            <div className="flex items-center gap-1 sm:opacity-70 sm:transition-opacity sm:group-hover:opacity-100">
              {insight.status === 'ACCEPTED' && (
                <Button
                  variant="brand"
                  size="sm"
                  onClick={() => updateStatus(insight.id, 'DOING')}
                >
                  Start doing
                </Button>
              )}
              {insight.status === 'DOING' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => updateStatus(insight.id, 'ACCEPTED')}
                  title="Pause back to Accepted"
                >
                  Pause
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateStatus(insight.id, 'DONE')}
                title="Mark done"
              >
                Done
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between gap-3">
        {hiddenCount > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            Show {hiddenCount} more
          </button>
        ) : reminders.length > COLLAPSED_COUNT ? (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900"
          >
            <ChevronUp className="h-3.5 w-3.5" />
            Collapse
          </button>
        ) : (
          <span />
        )}
        <Link
          href="/dashboard/coach"
          className="inline-flex items-center gap-1 text-xs font-medium text-[#8a7307] hover:underline"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Open Coach
        </Link>
      </div>
    </GlassCard>
  )
}
