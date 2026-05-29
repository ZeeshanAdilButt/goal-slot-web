'use client'

import { useEffect, useState } from 'react'

import { useDailyCheckin } from '@/features/dashboard/hooks/use-daily-checkin'
import { motion } from 'framer-motion'
import { Pencil } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'

// ScaleRow + summary icons live in ./checkin-dials so the floating button
// and the dashboard card share a single source of truth.
import { CheckinSummaryIcons as SummaryIcons, ScaleRow } from './checkin-dials'

export function DailyCheckinCard() {
  const { todayCheckin, submit } = useDailyCheckin()
  const [open, setOpen] = useState(false)
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [focus, setFocus] = useState<number | null>(null)
  const [blocked, setBlocked] = useState('')
  const [worked, setWorked] = useState('')

  // Bridge for the Ctrl+K command palette: dispatch `goalslot:open-checkin`
  // on window to open the check-in dialog. If the user already checked in
  // we pre-fill (edit flow); otherwise we open a fresh form.
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

  const openForEdit = () => {
    // Pre-fill the modal with whatever the user logged earlier so an "edit"
    // really is an edit, not a fresh start.
    if (todayCheckin) {
      setMood(todayCheckin.mood)
      setEnergy(todayCheckin.energy)
      setFocus(todayCheckin.focus)
      setBlocked(todayCheckin.blocked ?? '')
      setWorked(todayCheckin.worked ?? '')
    }
    setOpen(true)
  }

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
      <>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              title="View today's check-in"
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-zinc-900 bg-zinc-900 px-2.5 text-[11px] font-semibold tracking-tight text-white transition-colors hover:bg-zinc-800"
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#f2cc0d]" />
              <span>Checked in</span>
              <span aria-hidden className="text-zinc-500">·</span>
              <span className="text-[#f2cc0d]">today</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={8} className="w-64 border-zinc-200 p-0">
            <div className="space-y-2 px-3 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Today
              </div>
              <SummaryIcons
                mood={todayCheckin.mood}
                energy={todayCheckin.energy}
                focus={todayCheckin.focus}
              />
              {(todayCheckin.worked || todayCheckin.blocked) && (
                <div className="space-y-1.5 border-t border-zinc-100 pt-2 text-[12px] text-zinc-700">
                  {todayCheckin.worked && (
                    <p>
                      <span className="font-semibold text-zinc-900">Worked:</span> {todayCheckin.worked}
                    </p>
                  )}
                  {todayCheckin.blocked && (
                    <p>
                      <span className="font-semibold text-zinc-900">Got in the way:</span> {todayCheckin.blocked}
                    </p>
                  )}
                </div>
              )}
              <div className="flex justify-end pt-1">
                <Button type="button" variant="secondary" size="sm" onClick={openForEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-xl lg:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg">Update today’s check-in</DialogTitle>
              <DialogDescription className="text-sm">
                Pick a value for each dial. Saving overwrites today’s entry.
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
                  <Label htmlFor="checkin-edit-worked" className="text-xs normal-case tracking-normal text-zinc-700">
                    What worked?
                  </Label>
                  <Textarea
                    id="checkin-edit-worked"
                    rows={4}
                    value={worked}
                    onChange={(e) => setWorked(e.target.value)}
                    className="min-h-[96px] resize-y text-sm leading-relaxed"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="checkin-edit-blocked" className="text-xs normal-case tracking-normal text-zinc-700">
                    What got in the way?
                  </Label>
                  <Textarea
                    id="checkin-edit-blocked"
                    rows={4}
                    value={blocked}
                    onChange={(e) => setBlocked(e.target.value)}
                    className="min-h-[96px] resize-y text-sm leading-relaxed"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="brand" onClick={handleSubmit} disabled={!canSubmit}>
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      {/* Floating teaser — slides in from the top-right, sits clear of the
          top bar / banners, and stays out of the way until the user wants
          it. Default state is just an emoji + dot so it doesn't compete
          with page content; hovering reveals what it's for. Click anywhere
          on the teaser opens the full check-in dialog. */}
      <motion.div
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="group fixed right-3 top-24 z-30 sm:right-5 sm:top-28"
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="How did today land? Open the daily check-in."
          title="How did today land?"
          className="relative inline-flex items-center gap-2 rounded-full border border-[#f2cc0d]/60 bg-white/95 px-2.5 py-1.5 text-[12px] font-semibold text-zinc-800 shadow-lg ring-1 ring-[#f2cc0d]/30 backdrop-blur transition-all hover:border-[#f2cc0d] hover:bg-[#fff7d1] hover:pr-3.5 hover:shadow-xl"
        >
          <span aria-hidden className="text-base leading-none motion-safe:animate-[pulse_2.6s_ease-in-out_infinite]">
            🌤️
          </span>
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 inline-flex h-2 w-2 motion-safe:animate-ping rounded-full bg-[#f2cc0d] opacity-80"
          />
          <span aria-hidden className="absolute -right-0.5 -top-0.5 inline-flex h-2 w-2 rounded-full bg-[#f2cc0d]" />
          <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-[#8a7307] sm:inline">
            Check in
          </span>
        </button>

        {/* Hover reveal — the full pitch, anchored under the teaser.
            pointer-events-none on the wrapper plus the group/hover
            transition means it appears smoothly without blocking the
            content underneath when collapsed. */}
        <div className="pointer-events-none absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-1.5rem))] origin-top-right scale-95 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100">
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
                <Label htmlFor="checkin-worked" className="text-xs normal-case tracking-normal text-zinc-700">
                  What worked?
                </Label>
                <Textarea
                  id="checkin-worked"
                  rows={4}
                  placeholder="A block of deep work, a walk, sleep, a clear next step…"
                  value={worked}
                  onChange={(e) => setWorked(e.target.value)}
                  className="min-h-[96px] resize-y text-sm leading-relaxed"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="checkin-blocked" className="text-xs normal-case tracking-normal text-zinc-700">
                  What got in the way?
                </Label>
                <Textarea
                  id="checkin-blocked"
                  rows={4}
                  placeholder="Phone, low energy, unclear next step, something on your mind…"
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
