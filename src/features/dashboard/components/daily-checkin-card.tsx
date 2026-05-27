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

const SCALE = [1, 2, 3, 4, 5] as const
const SCALE_HINTS: Record<'mood' | 'energy' | 'focus', [string, string]> = {
  mood: ['low', 'great'],
  energy: ['drained', 'wired'],
  focus: ['scattered', 'sharp'],
}

interface ScaleRowProps {
  label: 'Mood' | 'Energy' | 'Focus'
  value: number | null
  onChange: (v: number) => void
}

function ScaleRow({ label, value, onChange }: ScaleRowProps) {
  const hint = SCALE_HINTS[label.toLowerCase() as keyof typeof SCALE_HINTS]
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
        <span className="text-[10px] text-zinc-400">
          {hint[0]} ↔ {hint[1]}
        </span>
      </div>
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
                'inline-flex h-11 flex-1 items-center justify-center rounded-lg border text-sm font-semibold transition-colors',
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
          Mood {todayCheckin.mood} · Energy {todayCheckin.energy} · Focus {todayCheckin.focus}
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
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>How did today land?</DialogTitle>
            <DialogDescription>
              Rate the three dials, then say one thing that helped and one thing that got in the way.
              You can leave the notes blank.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            <ScaleRow label="Mood" value={mood} onChange={setMood} />
            <ScaleRow label="Energy" value={energy} onChange={setEnergy} />
            <ScaleRow label="Focus" value={focus} onChange={setFocus} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="checkin-worked">What worked?</Label>
                <Textarea
                  id="checkin-worked"
                  rows={4}
                  placeholder="What made today move? A block of deep work, a walk, sleep, talking to someone…"
                  value={worked}
                  onChange={(e) => setWorked(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="checkin-blocked">What blocked you?</Label>
                <Textarea
                  id="checkin-blocked"
                  rows={4}
                  placeholder="What got in the way? Phone, low energy, an unclear next step, a meeting that drained you…"
                  value={blocked}
                  onChange={(e) => setBlocked(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
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
