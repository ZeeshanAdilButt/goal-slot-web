'use client'

import { useState } from 'react'

import { useDailyCheckin } from '@/features/dashboard/hooks/use-daily-checkin'
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

/**
 * Inline "Checked in · today" pill that lives on the /dashboard page when
 * the user has logged today's check-in. Tapping it shows a summary
 * popover with mood/energy/focus icons + the optional notes, and an Edit
 * button that opens the same 3-dial dialog pre-filled with today's values.
 *
 * The UNCHECKED state used to render a large in-flow banner here too —
 * that's been replaced by the floating top-right teaser in
 * `DailyCheckinBanner` (mounted at the dashboard layout level), so when
 * `todayCheckin` is null this component renders nothing.
 */
export function DailyCheckinCard() {
  const { todayCheckin, submit } = useDailyCheckin()
  const [open, setOpen] = useState(false)
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [focus, setFocus] = useState<number | null>(null)
  const [blocked, setBlocked] = useState('')
  const [worked, setWorked] = useState('')

  if (!todayCheckin) return null

  const canSubmit = mood !== null && energy !== null && focus !== null

  const openForEdit = () => {
    setMood(todayCheckin.mood)
    setEnergy(todayCheckin.energy)
    setFocus(todayCheckin.focus)
    setBlocked(todayCheckin.blocked ?? '')
    setWorked(todayCheckin.worked ?? '')
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
