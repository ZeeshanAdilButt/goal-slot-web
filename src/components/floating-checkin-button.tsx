'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'

import { useDailyCheckin } from '@/features/dashboard/hooks/use-daily-checkin'
import { Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type DialKey = 'mood' | 'energy' | 'focus'

const DIALS: Record<
  DialKey,
  { label: string; hint: [string, string]; emojis: [string, string, string, string, string] }
> = {
  mood: { label: 'Mood', hint: ['low', 'great'], emojis: ['😞', '😕', '😐', '🙂', '😄'] },
  energy: { label: 'Energy', hint: ['drained', 'wired'], emojis: ['😴', '🥱', '😐', '⚡️', '🔥'] },
  focus: { label: 'Focus', hint: ['scattered', 'sharp'], emojis: ['🌫️', '😵‍💫', '😐', '🎯', '🧠'] },
}

function ScaleRow({
  dial,
  value,
  onChange,
}: {
  dial: DialKey
  value: number | null
  onChange: (v: number) => void
}) {
  const { label, emojis } = DIALS[dial]
  return (
    <div>
      <div className="mb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-700">
          {label}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {emojis.map((emoji, idx) => {
          const n = idx + 1
          const selected = value === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-pressed={selected}
              aria-label={`${label} ${n} of 5`}
              className={cn(
                'inline-flex h-11 items-center justify-center rounded-lg text-2xl transition-all',
                selected
                  ? 'bg-[#fff7d1] ring-2 ring-[#f2cc0d] scale-[1.06]'
                  : 'bg-transparent hover:bg-zinc-50 hover:scale-105',
              )}
            >
              <span className="leading-none">{emoji}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Always-visible floating "Check in" button shown on every dashboard screen
 * until the user has logged today's check-in. Hidden once today is done so
 * we don't nag. Clicking opens the same 3-dial modal as the Dashboard card,
 * keeping the data path identical.
 */
export function FloatingCheckinButton() {
  const pathname = usePathname() ?? ''
  if (!pathname.startsWith('/dashboard')) return null
  return <FloatingCheckinButtonInner />
}

function FloatingCheckinButtonInner() {
  const { todayCheckin, submit } = useDailyCheckin()
  const [open, setOpen] = useState(false)
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [focus, setFocus] = useState<number | null>(null)
  const [blocked, setBlocked] = useState('')
  const [worked, setWorked] = useState('')

  // If today is already logged, do not nag.
  if (todayCheckin) return null

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Daily check-in"
        aria-label="Daily check-in"
        className="group relative inline-flex h-12 items-center gap-2 rounded-full border border-[#f2cc0d] bg-[#f2cc0d] px-4 text-sm font-semibold text-zinc-900 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#dfb90c]"
      >
        <Sparkles className="h-4 w-4" />
        Check in
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-xl lg:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">How did today land?</DialogTitle>
            <DialogDescription className="text-sm">
              Pick an emoji for each dial. Notes are optional.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            <div className="space-y-3">
              <ScaleRow dial="mood" value={mood} onChange={setMood} />
              <ScaleRow dial="energy" value={energy} onChange={setEnergy} />
              <ScaleRow dial="focus" value={focus} onChange={setFocus} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label
                  htmlFor="floating-checkin-worked"
                  className="text-xs normal-case tracking-normal text-zinc-700"
                >
                  What worked?
                </Label>
                <Textarea
                  id="floating-checkin-worked"
                  rows={4}
                  placeholder="A block of deep work, a walk, sleep, a clear next step..."
                  value={worked}
                  onChange={(e) => setWorked(e.target.value)}
                  className="min-h-[96px] resize-y text-sm leading-relaxed"
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="floating-checkin-blocked"
                  className="text-xs normal-case tracking-normal text-zinc-700"
                >
                  What got in the way?
                </Label>
                <Textarea
                  id="floating-checkin-blocked"
                  rows={4}
                  placeholder="Phone, low energy, unclear next step, something on your mind..."
                  value={blocked}
                  onChange={(e) => setBlocked(e.target.value)}
                  className="min-h-[96px] resize-y text-sm leading-relaxed"
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
