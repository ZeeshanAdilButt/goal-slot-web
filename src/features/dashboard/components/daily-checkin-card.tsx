'use client'

import { useState } from 'react'

import { useDailyCheckin } from '@/features/dashboard/hooks/use-daily-checkin'
import { toast } from 'react-hot-toast'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { Input } from '@/components/ui/input'
import { SectionHeader } from '@/components/ui/section-header'
import { StatusPill } from '@/components/ui/status-pill'

const SCALE = [1, 2, 3, 4, 5] as const

interface ScaleRowProps {
  label: string
  value: number | null
  onChange: (v: number) => void
}

function ScaleRow({ label, value, onChange }: ScaleRowProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
      <div className="flex items-center gap-2">
        {SCALE.map((n) => {
          const selected = value === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-pressed={selected}
              aria-label={`${label} ${n}`}
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold transition-colors',
                selected
                  ? 'bg-[#f2cc0d] text-zinc-900 border-yellow-400'
                  : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700',
              )}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function DailyCheckinCard() {
  const { todayCheckin, submit } = useDailyCheckin()
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [focus, setFocus] = useState<number | null>(null)
  const [blocked, setBlocked] = useState('')
  const [worked, setWorked] = useState('')

  if (todayCheckin) {
    return (
      <div className="flex items-center gap-2">
        <StatusPill variant="success" dot className="h-8 px-3">
          ✓ Checked in today
        </StatusPill>
        <span className="text-xs text-zinc-500">
          Mood {todayCheckin.mood} · Energy {todayCheckin.energy} · Focus {todayCheckin.focus}
        </span>
      </div>
    )
  }

  const canSubmit = mood !== null && energy !== null && focus !== null

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error('Pick a value for mood, energy, and focus.')
      return
    }
    submit({
      mood: mood!,
      energy: energy!,
      focus: focus!,
      blocked,
      worked,
    })
    toast.success('Checked in. Have a good one.')
  }

  return (
    <GlassCard padded>
      <SectionHeader title="Daily check-in" />
      <div className="space-y-4">
        <ScaleRow label="Mood" value={mood} onChange={setMood} />
        <ScaleRow label="Energy" value={energy} onChange={setEnergy} />
        <ScaleRow label="Focus" value={focus} onChange={setFocus} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            placeholder="What blocked you?"
            value={blocked}
            onChange={(e) => setBlocked(e.target.value)}
          />
          <Input
            placeholder="What worked?"
            value={worked}
            onChange={(e) => setWorked(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <Button variant="default" onClick={handleSubmit} disabled={!canSubmit}>
            Submit
          </Button>
        </div>
      </div>
    </GlassCard>
  )
}
