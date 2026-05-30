'use client'

import { useEffect, useState } from 'react'

import { ScaleRow } from '@/features/dashboard/components/checkin-dials'
import { useDailyCheckin } from '@/features/dashboard/hooks/use-daily-checkin'
import { motion } from 'framer-motion'
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
 * Floating daily check-in teaser. Sits top-right on every dashboard page
 * (mounted from dashboard/layout.tsx, replacing the old wall-eating banner
 * that lived under the focus bar). Default state is just an emoji + pulse
 * dot so it doesn't compete with page content; hovering reveals the full
 * pitch + a button. Clicking the pill opens the same 3-dial dialog.
 *
 * Component name kept as `DailyCheckinBanner` so the layout import path
 * doesn't need to change — the visual treatment is the only thing that's
 * different. Also wires the `goalslot:open-checkin` bridge for the
 * Ctrl+K command palette.
 */
export function DailyCheckinBanner() {
  const { todayCheckin, submit } = useDailyCheckin()
  const [open, setOpen] = useState(false)
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [focus, setFocus] = useState<number | null>(null)
  const [worked, setWorked] = useState('')
  const [blocked, setBlocked] = useState('')

  // Bridge for the Ctrl+K command palette: any code can dispatch
  // `goalslot:open-checkin` on window and the check-in dialog opens.
  // Pre-fills if the user already checked in so it works as an edit flow.
  useEffect(() => {
    const handler = () => {
      if (todayCheckin) {
        setMood(todayCheckin.mood)
        setEnergy(todayCheckin.energy)
        setFocus(todayCheckin.focus)
        setBlocked(todayCheckin.blocked ?? '')
        setWorked(todayCheckin.worked ?? '')
      }
      setOpen(true)
    }
    window.addEventListener('goalslot:open-checkin', handler as EventListener)
    return () => window.removeEventListener('goalslot:open-checkin', handler as EventListener)
  }, [todayCheckin])

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

  // If today is already checked in, the teaser hides. The dashboard-page
  // still shows a small inline "Checked in · today" pill via
  // DailyCheckinCard, so there's no loss of affordance.
  if (todayCheckin) return null

  return (
    <>
      {/*
        Anchored bottom-right and stacked directly above the floating
        Coach button (which lives at bottom-4 right-4 / right-6 on sm+).
        Was top-right earlier but that collided with every page's
        own action buttons (New Task on /tasks, New Goal on /goals,
        Add Block on /schedule, etc.) — top-right is the universal
        page-header CTA slot. Bottom-right keeps the teaser visible
        on every page without ever sitting on top of content.
      */}
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="group fixed bottom-20 right-4 z-30 sm:right-6"
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="How did today land? Open the daily check-in."
          title="How did today land?"
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/95 px-2.5 py-1.5 text-[12px] font-medium text-zinc-700 shadow-sm backdrop-blur transition-all hover:border-zinc-300 hover:bg-white hover:text-zinc-900 hover:shadow-md"
        >
          <span aria-hidden className="text-base leading-none">
            🌤️
          </span>
          <span className="hidden text-[11px] font-medium text-zinc-600 sm:inline">
            Check in
          </span>
        </button>

        {/* Hover card sits flush against the top of the button (no
            margin gap) so the cursor never crosses dead space when
            moving up to interact with it — earlier mb-2 created an
            8px no-mans-land where group-hover dropped and the card
            disappeared mid-reach. pb-2 pushes the visible card body
            up off the button while keeping the hit-area continuous. */}
        <div className="pointer-events-none absolute bottom-full right-0 w-[min(20rem,calc(100vw-1.5rem))] origin-bottom-right scale-95 pb-2 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100">
          <div className="rounded-xl border border-[#f2cc0d]/40 bg-white p-3 text-left shadow-2xl ring-1 ring-zinc-900/5">
            <p className="text-sm font-semibold text-zinc-900">How did today land?</p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-zinc-600">
              30 seconds. Mood, energy, focus, and what helped or got in
              the way. The Coach reads this.
            </p>
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={() => setOpen(true)}
              className="mt-2 w-full"
            >
              Open check-in
            </Button>
          </div>
        </div>
      </motion.div>

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
