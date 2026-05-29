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
 * Single-token scorer. Returns 0 for no hit; higher = better.
 *   - 2000+: full string starts with the token
 *   - 1500+: any whitespace-bounded word starts with the token
 *   - 1000+: substring anywhere
 *
 * NO subsequence matching (last version surfaced "Tasks" for "tracking"
 * because of shared letters — confused users more than it helped).
 *
 * The earlier-index-is-better bonuses keep ordering stable across ties.
 */
function tokenScore(token: string, text: string): number {
  if (!token || !text) return 0
  if (text.startsWith(token)) return 2000 + (50 - Math.min(text.length, 50))
  const words = text.split(/[\s/_\-.·:]+/)
  for (let i = 0; i < words.length; i++) {
    if (words[i].startsWith(token)) {
      return 1500 + (40 - Math.min(i, 40)) * 5
    }
  }
  const idx = text.indexOf(token)
  if (idx !== -1) return 1000 + (50 - Math.min(idx, 50))
  return 0
}

/**
 * Whole-query scorer. Handles multi-word input properly:
 *   - One token: just use tokenScore on the full text.
 *   - Multiple tokens: EVERY token must hit somewhere; the final score
 *     is the average so a perfect 2-of-2 still ranks higher than a
 *     loose 1-of-3 match. Whole-query prefix on the text gets a big
 *     bonus so "include both" → an item literally starting with
 *     "include both …" outranks any per-token combination.
 */
function textMatch(query: string, text: string | undefined | null): number {
  if (!query || !text) return 0
  const q = query.toLowerCase().trim()
  const t = text.toLowerCase()
  if (!q) return 0
  // Whole-query prefix wins above all per-token combinations.
  if (t.startsWith(q)) return 3000 + (50 - Math.min(t.length, 50))
  // Whole-query substring beats split scoring too — it means the user
  // typed a phrase that appears verbatim in the label.
  if (t.includes(q)) return 2500 + (50 - Math.min(t.indexOf(q), 50))
  const tokens = q.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return 0
  if (tokens.length === 1) return tokenScore(tokens[0], t)
  // Multi-token: AND all tokens. Bail on first miss.
  let total = 0
  for (const tok of tokens) {
    const s = tokenScore(tok, t)
    if (s === 0) return 0
    total += s
  }
  return Math.round(total / tokens.length)
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

    // /dashboard/goals/[id] doesn't exist as a route yet — link to the
    // goals list with a query param so the page can scroll/highlight if
    // it wants to later. Without the param at minimum we still land on
    // the right page.
    const goalCommands: Command[] = (goals as Goal[]).slice(0, 25).map((g: Goal) => ({
      id: `goal-${g.id}`,
      label: g.title,
      hint: `Goal · ${g.category ?? 'uncategorised'}`,
      icon: Flag,
      group: 'Goals',
      keywords: g.category ?? '',
      href: `/dashboard/goals?goal=${encodeURIComponent(g.id)}`,
    }))

    const taskCommands: Command[] = (tasks as Task[]).slice(0, 40).map((t: Task) => ({
      id: `task-${t.id}`,
      label: t.title,
      hint: t.goal?.title ? `Task · ${t.goal.title}` : 'Task',
      icon: CheckSquare,
      group: 'Tasks',
      keywords: `${t.goal?.title ?? ''} ${t.category ?? ''}`,
      href: `/dashboard/tasks?task=${encodeURIComponent(t.id)}`,
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
    // Group priority — small tie-breakers ONLY. Keep these tight so
    // they don't override a strong label match. Earlier the bonuses
    // were +300/+400 which let a Page substring-match outrank a Task
    // word-prefix match — the user's task got buried under noise.
    // With the new tokenScore tiers (2000/1500/1000), single-digit
    // bonuses are enough to break ties without distorting ranks.
    const GROUP_BONUS: Record<Command['group'], number> = {
      'Quick actions': 8,
      Pages: 6,
      Admin: 4,
      Tasks: 5,
      Goals: 3,
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

  // Reset to the top match every time the query changes — autocomplete
  // expectation: as the user types, the new #1 is what Enter opens.
  // Without this, the highlight stays on whatever ordinal index the
  // user last arrowed to (or the last result index after a clamp),
  // which feels broken when the list reorders under them.
  useEffect(() => {
    setHighlightedIdx(0)
  }, [query])

  // Defensive clamp if the list shrinks below the current index for
  // any other reason (e.g. background data refetch dropping items).
  useEffect(() => {
    if (highlightedIdx >= filtered.length) {
      setHighlightedIdx(filtered.length > 0 ? filtered.length - 1 : 0)
    }
  }, [filtered.length, highlightedIdx])

  const handleSelect = useCallback(
    (cmd: Command) => {
      // Close FIRST, then navigate — closing during navigation can race
      // with Next's route transition on slow networks.
      onOpenChange(false)
      // Use setTimeout to let React flush the close state before we push.
      // Without this, the palette occasionally "swallows" the navigation
      // on the same render tick.
      window.setTimeout(() => {
        if (cmd.onSelect) {
          cmd.onSelect()
        } else if (cmd.href) {
          router.push(cmd.href)
        }
      }, 0)
    },
    [onOpenChange, router],
  )

  // Refs so the keydown handler always reads the latest filtered list and
  // highlighted index — React batching means the closure captured at
  // render time can be stale by the time Enter fires after a fast keypress.
  const filteredRef = useRef(filtered)
  filteredRef.current = filtered
  const highlightedIdxRef = useRef(highlightedIdx)
  highlightedIdxRef.current = highlightedIdx

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setHighlightedIdx((i) =>
          Math.min(i + 1, Math.max(0, filteredRef.current.length - 1)),
        )
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setHighlightedIdx((i) => Math.max(i - 1, 0))
      } else if (event.key === 'Enter') {
        event.preventDefault()
        const list = filteredRef.current
        const idx = Math.min(highlightedIdxRef.current, list.length - 1)
        const cmd = list[idx >= 0 ? idx : 0]
        if (cmd) handleSelect(cmd)
      }
      // Escape is handled by useDismissable on the panel root.
    },
    [handleSelect],
  )

  // Keep the highlighted row in view as the user arrows through.
  // CRITICAL: do NOT use Element.scrollIntoView() here — `block: 'nearest'`
  // walks ALL scrollable ancestors (including the window) which on a tall
  // page causes the viewport to jump. That triggered a feedback loop with
  // onMouseMove on the rows (cursor was suddenly over a different row →
  // setHighlightedIdx → re-scroll → repeat). We scroll the list element
  // itself manually instead.
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const el = list.querySelector<HTMLElement>(
      `[data-cmd-index="${highlightedIdx}"]`,
    )
    if (!el) return
    const elTop = el.offsetTop
    const elBottom = elTop + el.offsetHeight
    const viewTop = list.scrollTop
    const viewBottom = viewTop + list.clientHeight
    if (elTop < viewTop) {
      list.scrollTop = elTop
    } else if (elBottom > viewBottom) {
      list.scrollTop = elBottom - list.clientHeight
    }
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
        className="w-full max-w-xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-zinc-900/5"
      >
        <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2.5">
          <Search aria-hidden className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
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
        onMouseMove={onHover}
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
      // onMouseMove (not onMouseEnter) — when the result list re-renders
      // as the user types, rows can land under a stationary cursor and
      // fire spurious mouseenter events, which previously kicked off a
      // scroll/highlight feedback loop. onMouseMove only fires on
      // actual cursor motion so layout shifts are inert.
      onMouseMove={onHover}
      onClick={onSelect}
      className={rowClass}
    >
      {inner}
    </button>
  )
}
