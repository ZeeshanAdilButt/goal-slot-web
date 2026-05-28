'use client'

import { useEffect, useMemo, useState } from 'react'

import { useTimerStore } from '@/lib/use-timer-store'
import { Loader2, Play, Search, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { useTimeTrackerData } from '@/features/time-tracker/hooks/use-time-tracker-queries'
import { findScheduleBlockForDateTime } from '@/features/time-tracker/utils/schedule'
import type { Task } from '@/features/time-tracker/utils/types'

interface StartTrackingPopoverProps {
  open: boolean
  onClose: () => void
}

/**
 * Bottom-right anchored popover that lets users start a timer from any
 * dashboard page without leaving where they are. Pre-fills the active
 * schedule block's task/goal/category as defaults; user can search/select
 * any task or type a free-form title.
 */
export function StartTrackingPopover({ open, onClose }: StartTrackingPopoverProps) {
  const { tasks, weeklySchedule } = useTimeTrackerData()
  const start = useTimerStore((s) => s.start)
  const [query, setQuery] = useState('')
  const [freeText, setFreeText] = useState('')

  const activeBlock = useMemo(() => {
    if (!weeklySchedule) return null
    return findScheduleBlockForDateTime(weeklySchedule, new Date())
  }, [weeklySchedule])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setFreeText('')
    }
  }, [open])

  const filtered = useMemo<Task[]>(() => {
    const q = query.trim().toLowerCase()
    const base: Task[] = tasks ?? []
    if (!q) {
      // Surface tasks linked to the active block's goal first.
      const goalId = activeBlock?.goalId
      if (goalId) {
        return [...base].sort((a, b) => {
          const aMatch = a.goalId === goalId ? 1 : 0
          const bMatch = b.goalId === goalId ? 1 : 0
          return bMatch - aMatch
        }).slice(0, 8)
      }
      return base.slice(0, 8)
    }
    return base.filter((t: Task) => t.title.toLowerCase().includes(q)).slice(0, 12)
  }, [tasks, query, activeBlock])

  const startWithTask = (task: Task) => {
    start(
      task.title,
      task.id,
      task.category || '',
      task.goalId || '',
      activeBlock?.id || '',
    )
    toast.success(`Tracking "${task.title}"`)
    onClose()
  }

  const startFreeform = () => {
    const trimmed = freeText.trim()
    if (!trimmed) {
      toast.error('Type what you are working on or pick a task')
      return
    }
    start(trimmed, '', '', activeBlock?.goalId || '', activeBlock?.id || '')
    toast.success(`Tracking "${trimmed}"`)
    onClose()
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-label="Start tracking"
      className="fixed bottom-20 right-4 z-50 flex w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
    >
      <header className="flex items-center justify-between border-b border-zinc-200 bg-gradient-to-br from-[#fffbea] to-white px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f2cc0d]/20 text-[#8a7307]">
            <Play className="h-3.5 w-3.5" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-zinc-900">Start tracking</div>
            {activeBlock ? (
              <div className="text-[10px] text-zinc-500">
                Now on schedule: <span className="font-medium text-zinc-700">{activeBlock.title}</span>
              </div>
            ) : (
              <div className="text-[10px] text-zinc-400">No active schedule block</div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Close"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="border-b border-zinc-100 px-3 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks..."
            className="h-9 w-full rounded-md border border-zinc-200 bg-white pl-8 pr-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
            autoFocus
          />
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto">
        {!tasks ? (
          <div className="flex items-center justify-center gap-2 px-3 py-6 text-xs text-zinc-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading tasks...
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-zinc-500">
            {query ? 'No tasks match. Type a custom title below and press Enter.' : 'No tasks yet.'}
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {filtered.map((task) => {
              const isActiveGoal = activeBlock?.goalId && task.goalId === activeBlock.goalId
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => startWithTask(task)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[#fff7d1]"
                  >
                    <span className="min-w-0 flex-1 truncate text-zinc-900">{task.title}</span>
                    <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-zinc-500">
                      {task.goal?.title && (
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5">
                          {task.goal.title}
                        </span>
                      )}
                      {isActiveGoal && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">on now</span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-zinc-200 bg-zinc-50 p-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
          Or start with a custom title
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                startFreeform()
              }
            }}
            placeholder="What are you working on?"
            className="h-8 flex-1 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
          />
          <button
            type="button"
            onClick={startFreeform}
            disabled={!freeText.trim()}
            className="inline-flex h-8 items-center gap-1 rounded-md bg-[#f2cc0d] px-2.5 text-xs font-semibold text-zinc-900 shadow-sm hover:bg-[#dfb90c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-3 w-3" />
            Start
          </button>
        </div>
      </div>
    </div>
  )
}
