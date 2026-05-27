'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { toast } from 'react-hot-toast'

import {
  CoachProfile,
  useCoachProfile,
} from '@/features/settings/hooks/use-coach-profile'
import { useCoachInsights } from '@/features/coach/hooks/use-coach-insights'
import { InsightCard } from '@/features/coach/components/insight-card'

import type {
  CoachInsightStatusEnum,
  CoachInsightStatusFilter,
  ReligiousContextEnum,
} from '@/lib/api'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { SectionHeader } from '@/components/ui/section-header'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const RELIGIOUS_CONTEXT_OPTIONS: { value: ReligiousContextEnum; label: string }[] = [
  { value: 'NONE', label: 'None (default)' },
  { value: 'ISLAM', label: 'Islam' },
  { value: 'CHRISTIANITY', label: 'Christianity' },
  { value: 'HINDUISM', label: 'Hinduism' },
  { value: 'BUDDHISM', label: 'Buddhism' },
  { value: 'JUDAISM', label: 'Judaism' },
  { value: 'SECULAR', label: 'Secular' },
  { value: 'OTHER', label: 'Other' },
]

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

export function SettingsCoachProfileTab() {
  const { profile, isLoaded, save } = useCoachProfile()
  const [form, setForm] = useState<CoachProfile>(profile)
  const [filter, setFilter] = useState<CoachInsightStatusFilter>('ACTIVE')

  const { insights, isLoading, updateStatus, remove } = useCoachInsights(filter)

  useEffect(() => {
    if (isLoaded) {
      setForm(profile)
    }
  }, [isLoaded, profile])

  const update = <K extends keyof CoachProfile>(field: K, value: CoachProfile[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const persist = async (next: CoachProfile) => {
    const result = await save(next)
    if (!result.success) {
      toast.error('Failed to save')
    }
  }

  const handleWhyBlur = () => {
    if (!isLoaded) return
    if (form.why === profile.why) return
    void persist(form)
  }

  const handleSpiritualNotesBlur = () => {
    if (!isLoaded) return
    if (form.spiritualNotes === profile.spiritualNotes) return
    void persist(form)
  }

  const handleReligiousContextChange = (value: string) => {
    const next = { ...form, religiousContext: value as ReligiousContextEnum }
    if (value === 'NONE') {
      next.spiritualNotes = ''
    }
    setForm(next)
    void persist(next)
  }

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
    <div className="space-y-6">
      <GlassCard padded>
        <SectionHeader title="Baseline" />
        <p className="text-sm text-zinc-600 mb-3">
          The Coach reads these whenever it talks to you. Keep it short and honest.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Your Why
            </label>
            <Textarea
              rows={4}
              placeholder="I want to build something I'm proud of, and reclaim my evenings for my family."
              value={form.why}
              onChange={(e) => update('why', e.target.value)}
              onBlur={handleWhyBlur}
            />
            <p className="mt-1 text-[11px] text-zinc-500">
              Saves automatically when you click away.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Spiritual / religious context
            </label>
            <Select
              value={form.religiousContext}
              onValueChange={handleReligiousContextChange}
            >
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {RELIGIOUS_CONTEXT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-zinc-500">
              When set, the Coach may invoke this tradition&apos;s framing where it genuinely helps. NONE = never.
            </p>
          </div>

          {form.religiousContext !== 'NONE' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Spiritual notes
              </label>
              <Textarea
                rows={3}
                placeholder="Anything specific you'd like the Coach to be aware of — e.g. praying 5x/day, dhikr habits, fasting."
                value={form.spiritualNotes}
                onChange={(e) => update('spiritualNotes', e.target.value)}
                onBlur={handleSpiritualNotesBlur}
              />
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard padded>
        <SectionHeader title="Active practice" />
        <p className="text-sm text-zinc-600 mb-3">
          Insights the Coach has surfaced from your weekly narratives. Accept the ones you want to commit to —
          the Coach will then track them across future weeks.
        </p>

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
          <p className="text-sm text-zinc-500">Loading insights…</p>
        ) : insights.length === 0 ? (
          <div className="space-y-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-center">
            <p className="text-sm text-zinc-600">
              No insights yet. Open this week&apos;s narrative to generate your first ones →
            </p>
            <div className="flex justify-center">
              <Link href="/dashboard/coach">
                <Button variant="brand" size="sm">
                  Go to Coach
                </Button>
              </Link>
            </div>
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
    </div>
  )
}
