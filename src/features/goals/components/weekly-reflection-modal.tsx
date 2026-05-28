'use client'

import { useEffect, useState } from 'react'

import { useGoalReflection } from '@/features/goals/hooks/use-goal-reflection'
import type { Goal } from '@/features/goals/utils/types'
import { toast } from 'react-hot-toast'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const SCALE = [1, 2, 3, 4, 5] as const

function humanWeekLabel(weekKey: string | null): string {
  if (!weekKey) return ''
  const m = /^(\d{4})-W(\d{2})$/.exec(weekKey)
  if (!m) return weekKey
  const year = Number(m[1])
  const week = Number(m[2])
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7
  const week1Monday = new Date(jan4)
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1))
  const monday = new Date(week1Monday)
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `This week - ${fmt(monday)} - ${fmt(sunday)}`
}

interface WeeklyReflectionModalProps {
  goal: Goal | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WeeklyReflectionModal({ goal, open, onOpenChange }: WeeklyReflectionModalProps) {
  const { lastReflection, submit, weekKey } = useGoalReflection(goal?.id ?? null)
  const [feel, setFeel] = useState<number | null>(null)
  const [worked, setWorked] = useState('')
  const [blocked, setBlocked] = useState('')
  const [nextWeekFocus, setNextWeekFocus] = useState('')

  // Re-hydrate form when opening or when last reflection changes
  useEffect(() => {
    if (open && lastReflection) {
      setFeel(lastReflection.feel)
      setWorked(lastReflection.worked)
      setBlocked(lastReflection.blocked)
      setNextWeekFocus(lastReflection.nextWeekFocus)
    } else if (open && !lastReflection) {
      setFeel(null)
      setWorked('')
      setBlocked('')
      setNextWeekFocus('')
    }
  }, [open, lastReflection])

  if (!goal) return null

  const handleSubmit = () => {
    if (feel === null) {
      toast.error('Pick how you feel about progress (1-5).')
      return
    }
    submit({ feel, worked, blocked, nextWeekFocus })
    toast.success('Reflection saved')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Weekly reflection - {goal.title}</DialogTitle>
          {weekKey && (
            <p className="text-xs text-zinc-500">{humanWeekLabel(weekKey)}</p>
          )}
        </DialogHeader>

        <div className="mt-4 space-y-5">
          <div>
            <Label className="mb-2 block">How does progress feel this week?</Label>
            <div className="flex items-center gap-2">
              {SCALE.map((n) => {
                const selected = feel === n
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setFeel(n)}
                    aria-pressed={selected}
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

          <div>
            <Label htmlFor="reflect-worked" className="mb-2 block">
              What worked?
            </Label>
            <Textarea
              id="reflect-worked"
              rows={3}
              value={worked}
              onChange={(e) => setWorked(e.target.value)}
              placeholder="Wins, momentum, what you'd do again."
            />
          </div>

          <div>
            <Label htmlFor="reflect-blocked" className="mb-2 block">
              What blocked you?
            </Label>
            <Textarea
              id="reflect-blocked"
              rows={3}
              value={blocked}
              onChange={(e) => setBlocked(e.target.value)}
              placeholder="Friction, distractions, dependencies."
            />
          </div>

          <div>
            <Label htmlFor="reflect-next" className="mb-2 block">
              Focus for next week?
            </Label>
            <Textarea
              id="reflect-next"
              rows={3}
              value={nextWeekFocus}
              onChange={(e) => setNextWeekFocus(e.target.value)}
              placeholder="The one thing that would make next week a win."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="brand" onClick={handleSubmit}>
              Save reflection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
