'use client'

import { useState } from 'react'

import { useDailyCheckin } from '@/features/dashboard/hooks/use-daily-checkin'
import { Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { StatusPill } from '@/components/ui/status-pill'
import { Textarea } from '@/components/ui/textarea'

type DialKey = 'mood' | 'energy' | 'focus'

const DIALS: Record<DialKey, { label: string; hint: [string, string]; emojis: [string, string, string, string, string] }> = {
  mood: {
    label: 'Mood',
    hint: ['low', 'great'],
    emojis: ['😞', '😕', '😐', '🙂', '😄'],
  },
  energy: {
    label: 'Energy',
    hint: ['drained', 'wired'],
    emojis: ['😴', '🥱', '😐', '⚡️', '🔥'],
  },
  focus: {
    label: 'Focus',
    hint: ['scattered', 'sharp'],
    emojis: ['🌫️', '😵‍💫', '😐', '🎯', '🧠'],
  },
}

interface ScaleRowProps {
  dial: DialKey
  value: number | null
  onChange: (v: number) => void
}

function ScaleRow({ dial, value, onChange }: ScaleRowProps) {
  const { label, hint, emojis } = DIALS[dial]
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
        <span className="text-[10px] text-zinc-400">
          {hint[0]} ↔ {hint[1]}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {emojis.map((emoji, idx) => {
          const n = idx + 1
          const selected = value === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-pressed={selected}
              aria-label={`${label} ${n} — ${idx === 0 ? hint[0] : idx === 4 ? hint[1] : ''}`}
              className={cn(
                'group inline-flex h-16 flex-col items-center justify-center gap-0.5 rounded-xl border text-2xl transition-all',
                selected
                  ? 'bg-[#f2cc0d]/10 border-[#f2cc0d] ring-2 ring-[#f2cc0d]/40 scale-[1.04]'
                  : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 hover:scale-[1.02] grayscale-[40%] hover:grayscale-0',
              )}
            >
              <span className={cn('leading-none transition-transform', selected && 'grayscale-0')}>{emoji}</span>
              <span
                className={cn(
                  'text-[9px] font-semibold tabular-nums',
                  selected ? 'text-zinc-900' : 'text-zinc-400',
                )}
              >
                {n}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function DailyCheckinCard() {
  const { todayCheckin, submit } = useDailyCheckin()
  const [open, setOpen] = useState(false)
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [focus, setFocus] = useState<number | null>(null)
  const [blocked, setBlocked] = useState('')
  const [worked, setWorked] = useState('')

  const canSubmit = mood !== null && energy !== null && focus !== null

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error('Pick a value for mood, energy, and focus.')
      return
    }
    submit({ mood: mood!, energy: energy!, focus: focus!, blocked, worked })
    toast.success('Checked in. Have a good one.')
    setOpen(false)
    setMood(null)
    setEnergy(null)
    setFocus(null)
    setBlocked('')
    setWorked('')
  }

  if (todayCheckin) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill variant="success" dot className="h-8 px-3">
          ✓ Checked in today
        </StatusPill>
        <span className="text-xs text-zinc-500">
          {DIALS.mood.emojis[(todayCheckin.mood ?? 1) - 1]} {DIALS.energy.emojis[(todayCheckin.energy ?? 1) - 1]}{' '}
          {DIALS.focus.emojis[(todayCheckin.focus ?? 1) - 1]}
        </span>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f2cc0d]/30 bg-[#f2cc0d]/5 px-4 py-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-zinc-900">How did today land?</p>
          <p className="text-xs text-zinc-600">
            30 seconds. Mood, energy, focus, and what helped or got in the way. The Coach reads this.
          </p>
        </div>
        <Button variant="brand" size="sm" onClick={() => setOpen(true)}>
          <Sparkles className="h-3.5 w-3.5" />
          Check in
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-2xl lg:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">How did today land?</DialogTitle>
            <DialogDescription>
              Tap an emoji per dial. Then say one thing that helped and one that got in the way.
              Notes are optional — write as much or as little as you want.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <ScaleRow dial="mood" value={mood} onChange={setMood} />
              <ScaleRow dial="energy" value={energy} onChange={setEnergy} />
              <ScaleRow dial="focus" value={focus} onChange={setFocus} />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="checkin-worked" className="text-sm normal-case tracking-normal">
                  ✨ What worked?
                </Label>
                <Textarea
                  id="checkin-worked"
                  rows={7}
                  placeholder="What made today move? A block of deep work, a walk, sleep, talking to someone, a clear next step…"
                  value={worked}
                  onChange={(e) => setWorked(e.target.value)}
                  className="min-h-[160px] resize-y text-[15px] leading-relaxed"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="checkin-blocked" className="text-sm normal-case tracking-normal">
                  🪨 What blocked you?
                </Label>
                <Textarea
                  id="checkin-blocked"
                  rows={7}
                  placeholder="What got in the way? Phone, low energy, an unclear next step, a meeting that drained you, something on your mind…"
                  value={blocked}
                  onChange={(e) => setBlocked(e.target.value)}
                  className="min-h-[160px] resize-y text-[15px] leading-relaxed"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Later
            </Button>
            <Button variant="brand" onClick={handleSubmit} disabled={!canSubmit}>
              Save check-in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
