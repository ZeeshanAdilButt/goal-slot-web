'use client'

import { useEffect, useState } from 'react'

import { CoachProfile, useCoachProfile } from '@/features/settings/hooks/use-coach-profile'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { Input } from '@/components/ui/input'
import { SectionHeader } from '@/components/ui/section-header'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

export function SettingsCoachProfileTab() {
  const { profile, isLoaded, isSaving, save } = useCoachProfile()
  const [form, setForm] = useState<CoachProfile>(profile)

  useEffect(() => {
    if (isLoaded) {
      setForm(profile)
    }
  }, [isLoaded, profile])

  const update = <K extends keyof CoachProfile>(field: K, value: CoachProfile[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    await save(form)
    toast.success('Coach profile saved')
  }

  return (
    <div className="space-y-6">
      <GlassCard padded>
        <SectionHeader title="Your Why" />
        <p className="text-sm text-zinc-600 mb-3">
          Why does this matter to you? The coach references this when nudging you back on track.
        </p>
        <Textarea
          rows={4}
          placeholder="I want to build something I'm proud of, and reclaim my evenings for my family."
          value={form.why}
          onChange={(e) => update('why', e.target.value)}
        />
      </GlassCard>

      <GlassCard padded>
        <SectionHeader title="Environment" />
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">Phone blocker installed</p>
              <p className="text-xs text-zinc-500">e.g. Opal, ScreenZen, or AppBlock.</p>
            </div>
            <Switch
              checked={form.phoneBlockerInstalled}
              onCheckedChange={(v) => update('phoneBlockerInstalled', v)}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">Distracting subscriptions cancelled</p>
              <p className="text-xs text-zinc-500">Streaming services, games, social premium tiers.</p>
            </div>
            <Switch
              checked={form.distractingSubsCancelled}
              onCheckedChange={(v) => update('distractingSubsCancelled', v)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Website blocker URLs
            </label>
            <Input
              placeholder="reddit.com, x.com, youtube.com"
              value={form.websiteBlockerUrls}
              onChange={(e) => update('websiteBlockerUrls', e.target.value)}
            />
            <p className="mt-1 text-[11px] text-zinc-500">Comma-separated list. The coach will reference these.</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard padded>
        <SectionHeader title="Sleep" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Target hours
            </label>
            <Input
              type="number"
              min={4}
              max={12}
              step={0.5}
              value={form.sleepTargetHours}
              onChange={(e) => update('sleepTargetHours', Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Bedtime
            </label>
            <Input type="time" value={form.bedtime} onChange={(e) => update('bedtime', e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Wake time
            </label>
            <Input type="time" value={form.wakeTime} onChange={(e) => update('wakeTime', e.target.value)} />
          </div>
        </div>
      </GlassCard>

      <GlassCard padded>
        <SectionHeader title="Work" />
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Work environment
            </label>
            <Textarea
              rows={3}
              placeholder="Remote, solo founder, ADHD, noisy coworking space..."
              value={form.workEnvironment}
              onChange={(e) => update('workEnvironment', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Additional context
            </label>
            <Textarea
              rows={4}
              placeholder="Anything else the coach should know — health, family, constraints, ambitions."
              value={form.additionalContext}
              onChange={(e) => update('additionalContext', e.target.value)}
            />
          </div>
        </div>
      </GlassCard>

      <div className="flex justify-end">
        <Button variant="brand" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save profile'}
        </Button>
      </div>
    </div>
  )
}
