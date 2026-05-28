'use client'

import { useState } from 'react'

import { useCoachInsights } from '@/features/coach/hooks/use-coach-insights'
import { InsightCard } from '@/features/coach/components/insight-card'
import { Compass } from 'lucide-react'

import type {
  CoachInsightStatusEnum,
  CoachInsightStatusFilter,
} from '@/lib/api'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/glass-card'
import { SectionHeader } from '@/components/ui/section-header'

interface FilterPill {
  key: string
  label: string
  filter: CoachInsightStatusFilter
}

const FILTER_PILLS: FilterPill[] = [
  { key: 'active', label: 'Active', filter: 'ACTIVE' },
  { key: 'doing', label: 'Doing', filter: 'DOING' },
  { key: 'done', label: 'Done', filter: 'DONE' },
  { key: 'dismissed', label: 'Dismissed', filter: 'DISMISSED' },
  { key: 'saved', label: 'Saved', filter: 'SAVED' },
]

/**
 * The full "active practice" surface — used to live in Settings → Coach
 * Profile, now lives on the Coach page itself so the user sees their
 * accepted/in-progress/done insights right next to the narrative + chat
 * that produces them. Settings keeps only the Baseline (Why + religious
 * context); a "Train Coach" link on this page jumps to that.
 */
export function ActivePracticeSection() {
  const [filter, setFilter] = useState<CoachInsightStatusFilter>('ACTIVE')
  const { insights, isLoading, updateStatus, remove } = useCoachInsights(filter)

  const handleInsightUpdate = (id: string, status: CoachInsightStatusEnum) => {
    updateStatus(id, status)
  }

  const handleInsightDelete = (id: string) => {
    const ok =
      typeof window !== 'undefined'
        ? window.confirm(
            'Delete this insight for good? Dismissed insights stay in your history unless you delete them here.',
          )
        : true
    if (!ok) return
    remove(id)
  }

  return (
    <GlassCard padded>
      <SectionHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Compass className="h-4 w-4" />
            Active practice
          </span>
        }
      />
      <div className="mb-3 rounded-xl border border-[#f2cc0d]/30 bg-[#fffbea] p-3 text-sm leading-relaxed text-zinc-700">
        These are the practices you said yes to. Keep them in view, mark one done when the habit
        actually lands in your week, and pause anything you're not ready to carry yet. Nothing here
        is a homework list. It's a conversation with the version of yourself you're trying to build.
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTER_PILLS.map((pill) => {
          const active = filter === pill.filter
          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => setFilter(pill.filter)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                active
                  ? 'border-yellow-400/40 bg-yellow-400/10 text-yellow-800'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50',
              )}
            >
              {pill.label}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading insights...</p>
      ) : insights.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-center text-sm text-zinc-500">
          Nothing here yet. Generate this week's narrative or save a Coach reply from the chat
          below to start tracking insights.
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onUpdate={(s) => handleInsightUpdate(insight.id, s)}
              onDelete={() => handleInsightDelete(insight.id)}
            />
          ))}
        </div>
      )}
    </GlassCard>
  )
}
