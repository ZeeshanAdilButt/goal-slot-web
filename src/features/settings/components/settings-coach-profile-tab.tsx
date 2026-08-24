'use client'

import { useEffect, useState } from 'react'

import { toast } from 'react-hot-toast'

import {
  CoachProfile,
  useCoachProfile,
} from '@/features/settings/hooks/use-coach-profile'

import type { ReligiousContextEnum } from '@/lib/api'

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

/**
 * Settings → Coach Profile is now JUST the baseline (Why + religious context).
 * The Active Practice insights list moved to the Coach page itself so users
 * work with their accepted insights right next to the narrative + chat that
 * produced them. From the Coach page, a "Train Coach" link brings users back
 * here to update the baseline.
 */
export function SettingsCoachProfileTab() {
  const { profile, isLoaded, save } = useCoachProfile()
  const [form, setForm] = useState<CoachProfile>(profile)

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

  return (
    <div className="space-y-6">
      <GlassCard padded>
        <SectionHeader title="Train the Coach" />
        <p className="mb-3 text-sm text-zinc-600">
          The Coach reads these whenever it talks to you. Keep it short and honest. The more
          accurate, the better the narratives and suggestions it gives back.
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
            <p className="mt-1 text-[11px] text-zinc-500">Saves automatically when you click away.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Spiritual / religious context
            </label>
            <Select value={form.religiousContext} onValueChange={handleReligiousContextChange}>
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
                placeholder="Anything specific you'd like the Coach to be aware of, e.g. praying 5x/day, dhikr habits, fasting."
                value={form.spiritualNotes}
                onChange={(e) => update('spiritualNotes', e.target.value)}
                onBlur={handleSpiritualNotesBlur}
              />
            </div>
          )}
        </div>
      </GlassCard>

      <p className="px-1 text-xs text-zinc-500">
        Looking for your accepted insights and Active practice? They live on the Coach page now,
        right next to the narrative + chat that produced them.
      </p>
    </div>
  )
}
