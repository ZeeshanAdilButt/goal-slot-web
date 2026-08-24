'use client'

import { useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { useUpdateScheduleBlock } from '@/features/schedule/hooks/use-schedule-mutations'
import { scheduleQueries } from '@/features/schedule/utils/queries'
import { ScheduleBlock, WeekSchedule } from '@/features/schedule/utils/types'
import { DAYS_OF_WEEK_FULL } from '@/lib/utils'
import { Loading } from '@/components/ui/loading'

// Sits on the Sharing page so the mentee can manage which schedule
// blocks their mentors are allowed to see in one place, without
// opening each block's edit modal. The per-block isPrivate flag and
// the lock icon on the schedule grid stay in sync because they all
// hit the same /schedule/:id endpoint.
export function SharingScheduleVisibility() {
  const { data, isLoading } = useQuery(scheduleQueries.weekly())
  const updateMutation = useUpdateScheduleBlock()
  const [busyId, setBusyId] = useState<string | null>(null)

  const blocksByDay = useMemo(() => {
    const map: Record<number, ScheduleBlock[]> = data ?? {}
    return DAYS_OF_WEEK_FULL.map((label, dayIdx) => ({
      day: dayIdx,
      label,
      blocks: (map[dayIdx] ?? []).slice().sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }))
  }, [data])

  const allBlocks = useMemo(() => blocksByDay.flatMap((d) => d.blocks), [blocksByDay])
  const privateCount = allBlocks.filter((b) => b.isPrivate).length
  const total = allBlocks.length

  const togglePrivacy = async (block: ScheduleBlock) => {
    if (busyId) return
    setBusyId(block.id)
    try {
      await updateMutation.mutateAsync({
        id: block.id,
        data: { isPrivate: !block.isPrivate, updateScope: 'single' },
      })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not update visibility')
    } finally {
      setBusyId(null)
    }
  }

  const bulkSet = async (next: boolean) => {
    if (busyId) return
    const target = allBlocks.filter((b) => b.isPrivate !== next)
    if (target.length === 0) return
    setBusyId('bulk')
    let ok = 0
    for (const b of target) {
      try {
        await updateMutation.mutateAsync({ id: b.id, data: { isPrivate: next, updateScope: 'single' } })
        ok++
      } catch {
        /* keep going, summarise at the end */
      }
    }
    setBusyId(null)
    toast.success(`Updated ${ok} block${ok === 1 ? '' : 's'}`)
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold uppercase sm:text-lg">
            <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
            What your mentors see
          </h2>
          <p className="mt-1 text-xs text-zinc-600">
            Toggle a block off to hide it (and its tracked time) from every mentor and public share link.
            You always see it on your own schedule.
          </p>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-2 text-[11px]">
            <span className="rounded-md bg-zinc-100 px-2 py-1 font-mono uppercase text-zinc-700">
              {total - privateCount} of {total} visible
            </span>
            <button
              type="button"
              onClick={() => bulkSet(true)}
              disabled={busyId !== null || privateCount === total}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hide all
            </button>
            <button
              type="button"
              onClick={() => bulkSet(false)}
              disabled={busyId !== null || privateCount === 0}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Show all
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loading size="sm" />
        </div>
      ) : total === 0 ? (
        <p className="py-6 text-center text-xs text-zinc-500">
          You have no schedule blocks yet. Create some on the Schedule page first.
        </p>
      ) : (
        <div className="divide-y divide-zinc-100">
          {blocksByDay
            .filter((d) => d.blocks.length > 0)
            .map((d) => (
              <div key={d.day} className="py-2 first:pt-0 last:pb-0">
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {d.label}
                </div>
                <ul className="space-y-1">
                  {d.blocks.map((block) => {
                    const isOn = !block.isPrivate
                    const disabled = busyId !== null
                    return (
                      <li
                        key={block.id}
                        className="flex items-center justify-between gap-3 rounded-md bg-zinc-50 px-2.5 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            aria-hidden
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: block.color }}
                          />
                          <span className="min-w-0 truncate text-sm font-semibold text-zinc-900">
                            {block.title}
                          </span>
                          <span className="shrink-0 font-mono text-[11px] text-zinc-500">
                            {block.startTime} - {block.endTime}
                          </span>
                          {block.goal && (
                            <span className="hidden truncate text-[11px] text-zinc-500 sm:inline">
                              · {block.goal.title}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => togglePrivacy(block)}
                          disabled={disabled}
                          aria-pressed={isOn}
                          aria-label={isOn ? 'Visible to mentors. Click to hide.' : 'Hidden from mentors. Click to show.'}
                          title={isOn ? 'Visible to mentors. Click to hide.' : 'Hidden from mentors. Click to show.'}
                          className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2 text-[11px] font-bold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            isOn
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                          }`}
                        >
                          {isOn ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {isOn ? 'Visible' : 'Hidden'}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
