'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckSquare,
  Clock,
  CornerDownLeft,
  Download,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Play,
  Search,
  Share2,
  Sparkles,
  Users,
  Flag,
  type LucideIcon,
} from 'lucide-react'

import { CoachIcon } from '@/components/icons/coach-icon'
import { FeatherPenIcon } from '@/components/icons/feather-pen-icon'
import { NotebookIcon } from '@/components/icons/notebook-icon'
import { useGoalsQuery } from '@/features/goals/hooks/use-goals-queries'
import { useTasksQuery } from '@/features/tasks/hooks/use-tasks-queries'
import type { Task } from '@/features/time-tracker/utils/types'
import type { Goal } from '@/features/goals/utils/types'
import { useIsAdmin } from '@/lib/store'
import { useDismissable } from '@/lib/use-dismissable'
import { cn } from '@/lib/utils'

type IconLike =
  | LucideIcon
  | ((props: { className?: string }) => React.ReactElement)

interface Command {
  id: string
  label: string
  hint?: string
  group: 'Quick actions' | 'Pages' | 'Admin' | 'Goals' | 'Tasks'
  keywords?: string
  icon: IconLike
  /** Either a navigation target… */
  href?: string
  /** …or an action invoked on Enter / click. */
  onSelect?: () => void
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Quick-action callbacks wired from the layout so the palette doesn't
      need to know how those floating panels are implemented. */
  onStartTracking?: () => void
  onOpenCoach?: () => void
  onOpenCheckin?: () => void
}

const PAGE_COMMANDS: Array<Omit<Command, 'group'> & { group: 'Pages' }> = [
  { id: 'page-dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', group: 'Pages', keywords: 'home overview' },
  { id: 'page-goals', label: 'Goals', icon: Flag, href: '/dashboard/goals', group: 'Pages', keywords: 'objectives okrs' },
  { id: 'page-schedule', label: 'Schedule', icon: Calendar, href: '/dashboard/schedule', group: 'Pages', keywords: 'calendar week blocks' },
  { id: 'page-tasks', label: 'Tasks', icon: CheckSquare, href: '/dashboard/tasks', group: 'Pages', keywords: 'todo backlog' },
  { id: 'page-tracker', label: 'Time Tracker', icon: Clock, href: '/dashboard/time-tracker', group: 'Pages', keywords: 'timer pomodoro' },
  { id: 'page-journal', label: 'Journal', icon: FeatherPenIcon, href: '/dashboard/journal', group: 'Pages', keywords: 'write reflect notes' },
  { id: 'page-coach', label: 'GoalSlot AI', icon: CoachIcon, href: '/dashboard/coach', group: 'Pages', keywords: 'coach ai assistant' },
  { id: 'page-notes', label: 'Notes', icon: NotebookIcon, href: '/dashboard/notes', group: 'Pages', keywords: 'docs writeup' },
  { id: 'page-reports', label: 'Reports', icon: BarChart3, href: '/dashboard/reports', group: 'Pages', keywords: 'analytics stats' },
  { id: 'page-export', label: 'Export Reports', icon: Download, href: '/dashboard/reports/export', group: 'Pages', keywords: 'csv download' },
  { id: 'page-sharing', label: 'Sharing', icon: Share2, href: '/dashboard/sharing', group: 'Pages', keywords: 'public share' },
]

const ADMIN_COMMANDS: Array<Omit<Command, 'group'> & { group: 'Admin' }> = [
  { id: 'admin-users', label: 'Users', icon: Users, href: '/dashboard/admin/users', group: 'Admin' },
  { id: 'admin-feedback', label: 'Feedback', icon: MessageSquare, href: '/dashboard/admin/feedback', group: 'Admin' },
  { id: 'admin-release', label: 'Release Notes', icon: Megaphone, href: '/dashboard/admin/release-notes', group: 'Admin' },
]

/**
 * Tiered text match. Returns 0 for no hit, higher = better:
 *   - 1000+: exact prefix on the text
 *   - 800+ : prefix on any whitespace-delimited word
 *   - 500+ : substring anywhere
 *   - 0    : no substring or word-prefix hit (we deliberately do NOT do
 *            subsequence matching — it surfaces "Tasks" for "tracking"
 *            because t-a-s-... shares letters with t-r-a-..., which is
 *            confusing more than helpful).
 *
 * The cheap "earlier index is better" subtraction inside each tier gives
 * stable ordering when several items hit the same tier.
 */
function textMatch(query: string, text: string | undefined | null): number {
  if (!query) return 0
  if (!text) return 0
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (t.startsWith(q)) return 1000 + (50 - Math.min(t.length, 50))
  // word-prefix: any whitespace-bounded token starts with the query
  const words = t.split(/[\s/_\-.·]+/)
  let bestWordIdx = -1
  for (let i = 0; i < words.length; i++) {
    if (words[i].startsWith(q)) {
      bestWordIdx = i
      break
    }
  }
  if (bestWordIdx !== -1) return 800 + (20 - Math.min(bestWordIdx, 20))
  const idx = t.indexOf(q)
  if (idx !== -1) return 500 + (50 - Math.min(idx, 50))
  return 0
}

export function CommandPalette({
  open,
  onOpenChange,
  onStartTracking,
  onOpenCoach,
  onOpenCheckin,
}: CommandPaletteProps) {
  const router = useRouter()
  const isAdmin = useIsAdmin()
  // These hooks share React Query cache with the rest of the app, so when
  // the user opens the palette on a page that already loaded goals/tasks
  // there's no extra request — and if they're not loaded yet, the palette
  // just starts empty for a tick and fills in on resolution.
  const { data: goals = [] } = useGoalsQuery()
  const { data: tasks = [] } = useTasksQuery({
    statuses: ['BACKLOG', 'TODO', 'DOING'],
  })

  const [query, setQuery] = useState('')
  const [highlightedIdx, setHighlightedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  // Reset on each open
  useEffect(() => {
    if (open) {
      setQuery('')
      setHighlightedIdx(0)
      // focus next tick so the dialog has time to mount
      const id = window.setTimeout(() => inputRef.current?.focus(), 30)
      return () => window.clearTimeout(id)
    }
  }, [open])

  const allCommands = useMemo<Command[]>(() => {
    const quick: Command[] = []
    if (onStartTracking) {
      quick.push({
        id: 'qa-start-tracking',
        label: 'Start tracking…',
        hint: 'Quick start a timer',
        icon: Play,
        group: 'Quick actions',
        keywords: 'timer pomodoro track',
        onSelect: () => onStartTracking(),
      })
    }
    if (onOpenCoach) {
      quick.push({
        id: 'qa-open-coach',
        label: 'Ask the Coach',
        hint: 'Open the floating Coach chat',
        icon: CoachIcon,
        group: 'Quick actions',
        keywords: 'ai assistant chat ask',
        onSelect: () => onOpenCoach(),
      })
    }
    if (onOpenCheckin) {
      quick.push({
        id: 'qa-checkin',
        label: 'Daily check-in',
        hint: 'Log mood, energy, focus',
        icon: Sparkles,
        group: 'Quick actions',
        keywords: 'mood energy focus reflect',
        onSelect: () => onOpenCheckin(),
      })
    }

    const goalCommands: Command[] = (goals as Goal[]).slice(0, 25).map((g: Goal) => ({
      id: `goal-${g.id}`,
      label: g.title,
      hint: `Goal · ${g.category ?? 'uncategorised'}`,
      icon: Flag,
      group: 'Goals',
      keywords: g.category ?? '',
      href: `/dashboard/goals/${g.id}`,
    }))

    const taskCommands: Command[] = (tasks as Task[]).slice(0, 40).map((t: Task) => ({
      id: `task-${t.id}`,
      label: t.title,
      hint: t.goal?.title ? `Task · ${t.goal.title}` : 'Task',
      icon: CheckSquare,
      group: 'Tasks',
      keywords: `${t.goal?.title ?? ''} ${t.category ?? ''}`,
      href: '/dashboard/tasks',
    }))

    const pages = PAGE_COMMANDS as Command[]
    const admin = isAdmin ? (ADMIN_COMMANDS as Command[]) : []

    return [...quick, ...pages, ...admin, ...goalCommands, ...taskCommands]
  }, [goals, tasks, isAdmin, onStartTracking, onOpenCoach, onOpenCheckin])

  const filtered = useMemo(() => {
    const q = query.trim()
    if (!q) {
      // No query: show the curated default order (quick actions, pages,
      // admin) and skip the huge goal/task lists to avoid wall-of-text.
      return allCommands.filter(
        (c) => c.group === 'Quick actions' || c.group === 'Pages' || c.group === 'Admin',
      )
    }
    // Group priority — lets us tie-break across tiers so that a query
    // matching a quick action ("tracking" → "Start tracking…") outranks
    // a same-tier hit on a goal/task with the same word. Larger = more
    // important. Tasks slightly outrank goals so the user's actionable
    // work surfaces above their long-term targets.
    const GROUP_BONUS: Record<Command['group'], number> = {
      'Quick actions': 400,
      Pages: 300,
      Admin: 200,
      Tasks: 100,
      Goals: 50,
    }
    const scored = allCommands
      .map((cmd) => {
        const labelScore = textMatch(q, cmd.label)
        const hintScore = textMatch(q, cmd.hint) * 0.5
        const keywordScore = textMatch(q, cmd.keywords) * 0.5
        const best = Math.max(labelScore, hintScore, keywordScore)
        if (best === 0) return { cmd, score: 0 }
        return { cmd, score: best + GROUP_BONUS[cmd.group] }
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
    return scored.map((s) => s.cmd)
  }, [allCommands, query])

  // Group preserving the order of `filtered`.
  const grouped = useMemo(() => {
    const buckets: Array<{ group: Command['group']; items: Command[] }> = []
    for (const cmd of filtered) {
      const last = buckets[buckets.length - 1]
      if (last && last.group === cmd.group) last.items.push(cmd)
      else buckets.push({ group: cmd.group, items: [cmd] })
    }
    return buckets
  }, [filtered])

  // Re-clamp the highlighted index whenever the result set shrinks (e.g.
  // user typed something that filtered the list down).
  useEffect(() => {
    if (highlightedIdx >= filtered.length) {
      setHighlightedIdx(filtered.length > 0 ? filtered.length - 1 : 0)
    }
  }, [filtered.length, highlightedIdx])

  const handleSelect = useCallback(
    (cmd: Command) => {
      onOpenChange(false)
      if (cmd.onSelect) {
        cmd.onSelect()
      } else if (cmd.href) {
        router.push(cmd.href)
      }
    },
    [onOpenChange, router],
  )

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIdx((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIdx((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const cmd = filtered[highlightedIdx]
      if (cmd) handleSelect(cmd)
    }
    // Escape is handled by useDismissable on the panel root.
  }

  // Keep the highlighted row in view as the user arrows through.
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-cmd-index="${highlightedIdx}"]`,
    )
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIdx])

  const dismissRef = useDismissable<HTMLDivElement>(open, () => onOpenChange(false))

  if (!open) return null

  let runningIndex = 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-zinc-900/30 px-4 pt-[12vh] backdrop-blur-sm"
      role="presentation"
    >
      <div
        ref={dismissRef}
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
        onKeyDown={handleKeyDown}
        className="w-full max-w-xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-zinc-900/5"
      >
        <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2.5">
          <Search aria-hidden className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, goals, tasks…  press Enter to open"
            className="h-7 w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-500 sm:inline">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
              Nothing matches “{query}”
            </div>
          ) : (
            grouped.map((bucket) => (
              <div key={bucket.group}>
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {bucket.group}
                </div>
                <div>
                  {bucket.items.map((cmd) => {
                    const idx = runningIndex++
                    const isActive = idx === highlightedIdx
                    const Icon = cmd.icon
                    return (
                      <CommandRow
                        key={cmd.id}
                        cmd={cmd}
                        index={idx}
                        active={isActive}
                        onHover={() => setHighlightedIdx(idx)}
                        onSelect={() => handleSelect(cmd)}
                        Icon={Icon}
                      />
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/80 px-3 py-1.5 text-[10.5px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-zinc-200 bg-white px-1 py-0.5 font-mono text-[10px] text-zinc-600">↑</kbd>
              <kbd className="rounded border border-zinc-200 bg-white px-1 py-0.5 font-mono text-[10px] text-zinc-600">↓</kbd>
              navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="inline-flex items-center rounded border border-zinc-200 bg-white px-1 py-0.5 font-mono text-[10px] text-zinc-600">
                <CornerDownLeft className="h-2.5 w-2.5" />
              </kbd>
              open
            </span>
          </div>
          <span className="inline-flex items-center gap-1 font-mono">
            <kbd className="rounded border border-zinc-200 bg-white px-1 py-0.5 text-[10px] text-zinc-600">⌘</kbd>
            <kbd className="rounded border border-zinc-200 bg-white px-1 py-0.5 text-[10px] text-zinc-600">K</kbd>
          </span>
        </div>
      </div>
    </div>
  )
}

function CommandRow({
  cmd,
  index,
  active,
  onHover,
  onSelect,
  Icon,
}: {
  cmd: Command
  index: number
  active: boolean
  onHover: () => void
  onSelect: () => void
  Icon: IconLike
}) {
  // Pages and admin entries get a real Link so cmd-click / middle-click
  // opens in a new tab; quick actions and dynamic goal/task entries
  // route through onSelect because they may run callbacks (or just to
  // keep dynamic IDs from leaking into prefetched routes).
  const isLink = !!cmd.href && !cmd.onSelect && cmd.group !== 'Goals' && cmd.group !== 'Tasks'

  const inner = (
    <>
      <Icon
        className={cn('h-4 w-4 shrink-0 text-zinc-500', active && 'text-zinc-900')}
      />
      <span className="min-w-0 flex-1 truncate text-sm text-zinc-900">
        {cmd.label}
      </span>
      {cmd.hint && (
        <span className="hidden truncate text-[11px] text-zinc-500 sm:inline">
          {cmd.hint}
        </span>
      )}
      <ArrowRight
        className={cn(
          'h-3.5 w-3.5 shrink-0 text-zinc-300 transition-opacity',
          active ? 'opacity-100' : 'opacity-0',
        )}
      />
    </>
  )

  const rowClass = cn(
    'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors',
    active ? 'bg-[#fff7d1]' : 'hover:bg-zinc-50',
  )

  if (isLink && cmd.href) {
    return (
      <Link
        href={cmd.href}
        data-cmd-index={index}
        onMouseEnter={onHover}
        onClick={(e) => {
          // Plain click goes through our onSelect to close the palette;
          // cmd/ctrl/middle-click let the browser open a new tab as usual.
          if (e.metaKey || e.ctrlKey || e.button === 1) return
          e.preventDefault()
          onSelect()
        }}
        className={rowClass}
      >
        {inner}
      </Link>
    )
  }

  return (
    <button
      type="button"
      data-cmd-index={index}
      onMouseEnter={onHover}
      onClick={onSelect}
      className={rowClass}
    >
      {inner}
    </button>
  )
}
