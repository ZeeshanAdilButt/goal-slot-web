'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useTimerStore } from '@/lib/use-timer-store'
import { ChevronDown, Loader2, Play, Plus, Search, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { useTimeTrackerData } from '@/features/time-tracker/hooks/use-time-tracker-queries'
import {
  findNextScheduleBlock,
  findScheduleBlockForDateTime,
} from '@/features/time-tracker/utils/schedule'
import type { Task } from '@/features/time-tracker/utils/types'
import { useCreateTaskMutation } from '@/features/tasks/hooks/use-tasks-mutations'
import { useDismissable } from '@/lib/use-dismissable'
import { useFloatingUiStore } from '@/lib/use-floating-ui-store'

interface StartTrackingPopoverProps {
  open: boolean
  onClose: () => void
}

const NO_GOAL = '__NO_GOAL__'

interface GoalLite {
  id: string
  title: string
}

interface GoalAutocompleteProps {
  value: string
  onChange: (id: string) => void
  goals: GoalLite[]
  activeBlockGoalId?: string | null
  // Externally-owned ref so the parent popover's outside-click dismiss can
  // treat the portalled panel as "inside" and not close the whole popover
  // when the user clicks on a goal.
  panelRef: React.MutableRefObject<HTMLDivElement | null>
}

// Small inline autocomplete used for picking a goal in the "create task"
// row. Replaces the native <select> so users can type instead of scrolling
// through every goal on the account. The dropdown panel is portalled to
// document.body and positioned with fixed coordinates because the parent
// popover uses `overflow-hidden` and the results list uses `overflow-y-auto`,
// either of which would clip an absolutely-positioned dropdown.
function GoalAutocomplete({
  value,
  onChange,
  goals,
  activeBlockGoalId,
  panelRef,
}: GoalAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null)

  const displayName =
    value === NO_GOAL ? 'No goal' : goals.find((g) => g.id === value)?.title || 'No goal'

  const items: GoalLite[] = useMemo(() => {
    const all: GoalLite[] = [{ id: NO_GOAL, title: 'No goal' }, ...goals]
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((g) => g.title.toLowerCase().includes(q))
  }, [goals, search])

  // Position the dropdown above the button (the popover lives near the
  // bottom-right of the viewport so up is the safe direction). Recomputes
  // on open and on window scroll/resize.
  useLayoutEffect(() => {
    if (!open) return
    const computePosition = () => {
      const btn = buttonRef.current
      if (!btn) return
      const rect = btn.getBoundingClientRect()
      const panelWidth = 224 // matches w-56 below
      const estimatedPanelHeight = 220 // search input + ~5 rows; fine for non-overlap math
      const left = Math.max(8, Math.min(window.innerWidth - panelWidth - 8, rect.right - panelWidth))
      const top = Math.max(8, rect.top - estimatedPanelHeight - 4)
      setPanelPos({ top, left })
    }
    computePosition()
    window.addEventListener('scroll', computePosition, true)
    window.addEventListener('resize', computePosition)
    return () => {
      window.removeEventListener('scroll', computePosition, true)
      window.removeEventListener('resize', computePosition)
    }
  }, [open])

  // Close on outside click. Both the trigger button and the portalled
  // panel count as "inside" so clicks inside the panel do not close it.
  useEffect(() => {
    if (!open) return
    const onDocPointer = (e: PointerEvent) => {
      const target = e.target as Node
      if (buttonRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
      setSearch('')
    }
    document.addEventListener('pointerdown', onDocPointer)
    return () => document.removeEventListener('pointerdown', onDocPointer)
  }, [open])

  const panel =
    open && panelPos && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={panelRef}
            style={{ top: panelPos.top, left: panelPos.left, width: 224 }}
            className="fixed z-[60] overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg"
          >
            <div className="border-b border-zinc-100 p-1.5">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    setOpen(false)
                    setSearch('')
                  }
                }}
                placeholder="Search goals..."
                autoFocus
                className="h-7 w-full rounded border border-zinc-200 bg-white px-2 text-[11px] text-zinc-900 placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
              />
            </div>
            <ul className="max-h-44 overflow-y-auto py-1">
              {items.length === 0 ? (
                <li className="px-2.5 py-1.5 text-[11px] text-zinc-400">No goals match</li>
              ) : (
                items.map((g) => {
                  const isOnNow = g.id !== NO_GOAL && g.id === activeBlockGoalId
                  const isSelected = g.id === value
                  return (
                    <li key={g.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(g.id)
                          setOpen(false)
                          setSearch('')
                        }}
                        className={`flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-[11px] transition-colors ${
                          isSelected
                            ? 'bg-[#fff7d1] text-zinc-900'
                            : 'text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        <span className="truncate">{g.title}</span>
                        {isOnNow && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                            on now
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-7 max-w-[10rem] items-center gap-1 truncate rounded-md border border-zinc-200 bg-white px-2 text-[11px] font-medium text-zinc-800 hover:bg-zinc-50"
        title={`Goal: ${displayName}`}
      >
        <span className="truncate">{displayName}</span>
        <ChevronDown className="h-3 w-3 shrink-0 text-zinc-400" />
      </button>
      {panel}
    </>
  )
}

export function StartTrackingPopover({ open, onClose }: StartTrackingPopoverProps) {
  const { tasks, weeklySchedule, goals } = useTimeTrackerData()
  const start = useTimerStore((s) => s.start)
  const createTaskMutation = useCreateTaskMutation()
  const setStartTrackingOpen = useFloatingUiStore((s) => s.setStartTrackingOpen)
  const [query, setQuery] = useState('')
  const [selectedGoalId, setSelectedGoalId] = useState<string>(NO_GOAL)
  // Tracks whether the user has explicitly picked a goal in this session of
  // the popover. Once true we stop auto-syncing to the active schedule
  // block's goal so the clock ticking past a block boundary does not blow
  // away the user's manual choice.
  const [goalEditedByUser, setGoalEditedByUser] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const taskListRef = useRef<HTMLUListElement | null>(null)
  // The portalled goal-picker panel lives outside this popover in the DOM,
  // so the parent's outside-click dismiss needs to treat it as "inside".
  const goalPanelRef = useRef<HTMLDivElement | null>(null)

  const activeBlock = useMemo(() => {
    if (!weeklySchedule) return null
    return findScheduleBlockForDateTime(weeklySchedule, new Date())
  }, [weeklySchedule])

  const nextBlock = useMemo(() => {
    if (activeBlock || !weeklySchedule) return null
    return findNextScheduleBlock(weeklySchedule, new Date())?.block ?? null
  }, [weeklySchedule, activeBlock])

  // The goal we default the picker to: active block first, then upcoming
  // block if nothing is currently scheduled, else No goal.
  const suggestedGoalId = activeBlock?.goalId || nextBlock?.goalId || null

  // Sync open state with the floating UI store so other floating widgets
  // (check-in pill, coach button) can step aside while this popover owns
  // the bottom-right corner.
  useEffect(() => {
    setStartTrackingOpen(open)
    if (!open) {
      setQuery('')
      setIsCreating(false)
      setGoalEditedByUser(false)
    }
    return () => setStartTrackingOpen(false)
  }, [open, setStartTrackingOpen])

  // Pre-fill the goal whenever the popover opens or the suggested goal
  // changes, BUT do not stomp on a manual selection the user has already
  // made during this session.
  useEffect(() => {
    if (!open) return
    if (goalEditedByUser) return
    setSelectedGoalId(suggestedGoalId || NO_GOAL)
  }, [open, suggestedGoalId, goalEditedByUser])

  // Reset the keyboard highlight to the first row every time the search
  // query changes so Enter always starts the top match. Also reset to 0
  // when the popover re-opens.
  useEffect(() => {
    setHighlightedIndex(0)
  }, [query, open])

  const filtered = useMemo<Task[]>(() => {
    const q = query.trim().toLowerCase()
    const base: Task[] = tasks ?? []
    if (!q) {
      const goalId = activeBlock?.goalId
      if (goalId) {
        return [...base]
          .sort((a, b) => {
            const aMatch = a.goalId === goalId ? 1 : 0
            const bMatch = b.goalId === goalId ? 1 : 0
            return bMatch - aMatch
          })
          .slice(0, 8)
      }
      return base.slice(0, 8)
    }
    return base.filter((t: Task) => t.title.toLowerCase().includes(q)).slice(0, 12)
  }, [tasks, query, activeBlock])

  const trimmedQuery = query.trim()
  const hasExactMatch = useMemo(() => {
    if (!trimmedQuery) return false
    const needle = trimmedQuery.toLowerCase()
    return (tasks ?? []).some((t: Task) => t.title.toLowerCase() === needle)
  }, [tasks, trimmedQuery])
  const showCreateRow = trimmedQuery.length > 0 && !hasExactMatch

  // The combined row count for keyboard navigation: existing matches +
  // (optionally) the synthetic "Create" row at the very end.
  const rowCount = filtered.length + (showCreateRow ? 1 : 0)
  const createRowIndex = showCreateRow ? filtered.length : -1

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

  // Create a real Task with the chosen goal, then start the timer pointing
  // at that task. The title comes from the search input so the user does
  // not have to retype what they were searching for.
  const createTaskFromQuery = async () => {
    if (!trimmedQuery) return
    setIsCreating(true)
    try {
      const goalId = selectedGoalId === NO_GOAL ? undefined : selectedGoalId
      const created = await createTaskMutation.mutateAsync({
        title: trimmedQuery,
        goalId,
        scheduleBlockId: activeBlock?.id || undefined,
      } as any)
      start(
        created.title,
        created.id,
        created.category || '',
        created.goalId || '',
        activeBlock?.id || '',
      )
      onClose()
    } catch {
      // mutation already toasts the failure
    } finally {
      setIsCreating(false)
    }
  }

  // Free-text "Just track" path: no task entity created, only a time entry
  // with the title. Kept as a secondary action for quick-capture of
  // interruptions.
  const startFreeform = () => {
    if (!trimmedQuery) {
      toast.error('Type what you are working on')
      return
    }
    const goalId = selectedGoalId === NO_GOAL ? '' : selectedGoalId
    start(trimmedQuery, '', '', goalId, activeBlock?.id || '')
    toast.success(`Tracking "${trimmedQuery}"`)
    onClose()
  }

  // The goal picker panel is rendered in a portal, so we have to tell the
  // dismiss handler to ignore clicks landing inside it.
  const ignoreRefs = useMemo(() => [goalPanelRef], [])
  const dismissRef = useDismissable<HTMLDivElement>(open, onClose, ignoreRefs)

  if (!open) return null

  const handleGoalChange = (id: string) => {
    setSelectedGoalId(id)
    setGoalEditedByUser(true)
  }

  return (
    <div
      ref={dismissRef}
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
                Now on schedule:{' '}
                <span className="font-medium text-zinc-700">{activeBlock.title}</span>
              </div>
            ) : nextBlock ? (
              <div className="text-[10px] text-zinc-500">
                Up next: <span className="font-medium text-zinc-700">{nextBlock.title}</span>
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
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setHighlightedIndex((i) =>
                  rowCount === 0 ? 0 : Math.min(i + 1, rowCount - 1),
                )
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setHighlightedIndex((i) => Math.max(i - 1, 0))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                if (highlightedIndex === createRowIndex && showCreateRow) {
                  void createTaskFromQuery()
                  return
                }
                if (filtered.length > 0) {
                  const pick = filtered[highlightedIndex] ?? filtered[0]
                  if (pick) startWithTask(pick)
                } else if (showCreateRow) {
                  void createTaskFromQuery()
                }
              } else if (e.key === 'Escape') {
                if (query) {
                  e.preventDefault()
                  setQuery('')
                }
              }
            }}
            placeholder="Search tasks or type to create..."
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
        ) : filtered.length === 0 && !showCreateRow ? (
          <div className="px-3 py-6 text-center text-xs text-zinc-500">No tasks yet.</div>
        ) : (
          <ul ref={taskListRef} className="divide-y divide-zinc-100">
            {filtered.map((task, idx) => {
              const isActiveGoal = activeBlock?.goalId && task.goalId === activeBlock.goalId
              const isHighlighted = idx === highlightedIndex
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    ref={(el) => {
                      if (el && isHighlighted) {
                        el.scrollIntoView({ block: 'nearest' })
                      }
                    }}
                    onClick={() => startWithTask(task)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    title={`Start tracking "${task.title}"`}
                    className={`group/row flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                      isHighlighted ? 'bg-[#fff7d1]' : 'hover:bg-[#fff7d1]'
                    }`}
                  >
                    <span
                      aria-hidden
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition-colors group-hover/row:border-[#f2cc0d] group-hover/row:bg-[#f2cc0d] group-hover/row:text-zinc-900"
                    >
                      <Play className="h-3 w-3 fill-current" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-zinc-900">{task.title}</span>
                    <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-zinc-500">
                      {task.goal?.title && (
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5">{task.goal.title}</span>
                      )}
                      {isActiveGoal && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">
                          on now
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
            {showCreateRow && (
              <li>
                <div
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    highlightedIndex === createRowIndex
                      ? 'bg-amber-50'
                      : 'bg-amber-50/40 hover:bg-amber-50'
                  }`}
                  onMouseEnter={() => setHighlightedIndex(createRowIndex)}
                >
                  <span
                    aria-hidden
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-600"
                  >
                    <Plus className="h-3 w-3" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-zinc-800">
                    Create <span className="font-semibold">&ldquo;{trimmedQuery}&rdquo;</span>
                    <span className="text-zinc-500"> under</span>
                  </span>
                  <GoalAutocomplete
                    value={selectedGoalId}
                    onChange={handleGoalChange}
                    panelRef={goalPanelRef}
                    goals={goals ?? []}
                    activeBlockGoalId={suggestedGoalId}
                  />
                  <button
                    type="button"
                    onClick={() => void createTaskFromQuery()}
                    disabled={isCreating}
                    title={`Create task and start tracking`}
                    className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md bg-[#f2cc0d] px-2 text-[11px] font-semibold text-zinc-900 hover:bg-[#dfb90c] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isCreating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
                    Start
                  </button>
                </div>
              </li>
            )}
          </ul>
        )}
      </div>

      {showCreateRow && (
        <div className="border-t border-zinc-100 bg-zinc-50 px-3 py-1.5">
          <button
            type="button"
            onClick={startFreeform}
            className="text-[11px] text-zinc-500 hover:text-zinc-800 hover:underline"
            title="Start a timer without creating a task entity"
          >
            or just track &ldquo;{trimmedQuery}&rdquo; without creating a task &rarr;
          </button>
        </div>
      )}
    </div>
  )
}
