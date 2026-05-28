'use client'

import { useState } from 'react'

import { ScaleRow } from '@/features/dashboard/components/checkin-dials'
import { useDailyCheckin } from '@/features/dashboard/hooks/use-daily-checkin'
import { toast } from 'react-hot-toast'

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

/**
 * Site-wide top banner that nudges the user to log today's check-in.
 * Renders on every dashboard page (mounted in dashboard/layout.tsx) until
 * today's check-in is logged, then hides. Tap "Check in" to open the same
 * 3-dial modal the dashboard card uses, keeping the data path identical.
 */
export function DailyCheckinBanner() {
  const { todayCheckin, submit } = useDailyCheckin()
  const [open, setOpen] = useState(false)
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [focus, setFocus] = useState<number | null>(null)
  const [worked, setWorked] = useState('')
  const [blocked, setBlocked] = useState('')

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
      <div className="border-b border-[#f2cc0d]/30 bg-[#fffbea]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f2cc0d] text-[12px] font-bold text-zinc-900"
            >
              ?
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold leading-tight text-zinc-900">
                How did today land?
              </p>
              <p className="hidden text-[11px] leading-tight text-zinc-600 sm:block">
                30 seconds. Mood, energy, focus, and what helped or got in the way. The Coach reads this.
              </p>
            </div>
          </div>
          <Button variant="brand" size="sm" onClick={() => setOpen(true)}>
            Check in
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-xl lg:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">How did today land?</DialogTitle>
            <DialogDescription className="text-sm">
              Pick a value for each dial. Notes are optional.
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
                  htmlFor="banner-checkin-worked"
                  className="text-xs normal-case tracking-normal text-zinc-700"
                >
                  What worked?
                </Label>
                <Textarea
                  id="banner-checkin-worked"
                  rows={4}
                  placeholder="A block of deep work, a walk, sleep, a clear next step..."
                  value={worked}
                  onChange={(e) => setWorked(e.target.value)}
                  className="min-h-[96px] resize-y text-sm leading-relaxed"
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="banner-checkin-blocked"
                  className="text-xs normal-case tracking-normal text-zinc-700"
                >
                  What got in the way?
                </Label>
                <Textarea
                  id="banner-checkin-blocked"
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
