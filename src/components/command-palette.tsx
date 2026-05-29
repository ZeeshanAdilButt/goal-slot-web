'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Command } from 'cmdk'
import { useQueryClient } from '@tanstack/react-query'
import {
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

/**
 * Ctrl/Cmd+K command palette.
 *
 * Built on `cmdk` (the Radix-team primitive used by Linear, Vercel,
 * GitHub Copilot, etc.) so state, keyboard nav, and filtering are
 * handled by a well-tested library instead of our own re-rolled logic.
 * Our previous hand-rolled implementation kept introducing edge-case
 * bugs (stale state on close/reopen, hint-only matches ranking above
 * label matches, scroll-jitter feedback loops) — moving to cmdk
 * eliminates that entire class.
 *
 * The only logic we add on top is:
 *   - A custom `filter` function that implements TIERED scoring so a
 *     label hit always outranks a hint/keyword hit (cmdk's default
 *     fuzzy filter ranks roughly by character overlap which lets a
 *     keyword-only match creep above a label substring match).
 *   - A `key` on the Command root that bumps every time the palette
 *     opens, forcing cmdk to fully reset its internal search/value
 *     state. Cheap, completely eliminates the "stale state on reopen"
 *     class of bugs that we kept hitting.
 *   - Bridge to existing floating panels via window CustomEvents so
 *     Start tracking / Ask the Coach / Daily check-in trigger the
 *     already-mounted UIs.
 */

type IconLike = LucideIcon | ((props: { className?: string }) => React.ReactElement)

interface PaletteItem {
  id: string
  label: string
  hint?: string
  /** Free-text used by the filter only — never shown. */
  keywords?: string
  group: 'Quick actions' | 'Pages' | 'Admin' | 'Goals' | 'Tasks'
  icon: IconLike
  href?: string
  onSelect?: () => void
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStartTracking?: () => void
  onOpenCoach?: () => void
  onOpenCheckin?: () => void
}

// ---------------------------------------------------------------------------
// Static command sets
// ---------------------------------------------------------------------------

const PAGE_ITEMS: PaletteItem[] = [
  { id: 'page-dashboard',  label: 'Dashboard',      icon: LayoutDashboard, href: '/dashboard',                 group: 'Pages', keywords: 'home overview' },
  { id: 'page-goals',      label: 'Goals',          icon: Flag,            href: '/dashboard/goals',           group: 'Pages', keywords: 'objectives okrs' },
  { id: 'page-schedule',   label: 'Schedule',       icon: Calendar,        href: '/dashboard/schedule',        group: 'Pages', keywords: 'calendar week blocks' },
  { id: 'page-tasks',      label: 'Tasks',          icon: CheckSquare,     href: '/dashboard/tasks',           group: 'Pages', keywords: 'todo backlog' },
  { id: 'page-tracker',    label: 'Time Tracker',   icon: Clock,           href: '/dashboard/time-tracker',    group: 'Pages', keywords: 'timer pomodoro' },
  { id: 'page-journal',    label: 'Journal',        icon: FeatherPenIcon,  href: '/dashboard/journal',         group: 'Pages', keywords: 'write reflect' },
  { id: 'page-coach',      label: 'GoalSlot AI',    icon: CoachIcon,       href: '/dashboard/coach',           group: 'Pages', keywords: 'coach ai assistant' },
  { id: 'page-notes',      label: 'Notes',          icon: NotebookIcon,    href: '/dashboard/notes',           group: 'Pages', keywords: 'docs writeup' },
  { id: 'page-reports',    label: 'Reports',        icon: BarChart3,       href: '/dashboard/reports',         group: 'Pages', keywords: 'analytics stats' },
  { id: 'page-export',     label: 'Export Reports', icon: Download,        href: '/dashboard/reports/export',  group: 'Pages', keywords: 'csv download' },
  { id: 'page-sharing',    label: 'Sharing',        icon: Share2,          href: '/dashboard/sharing',         group: 'Pages', keywords: 'public share' },
]

const ADMIN_ITEMS: PaletteItem[] = [
  { id: 'admin-users',         label: 'Users',         icon: Users,         href: '/dashboard/admin/users',         group: 'Admin' },
  { id: 'admin-feedback',      label: 'Feedback',      icon: MessageSquare, href: '/dashboard/admin/feedback',      group: 'Admin' },
  { id: 'admin-release-notes', label: 'Release Notes', icon: Megaphone,     href: '/dashboard/admin/release-notes', group: 'Admin' },
]

// ---------------------------------------------------------------------------
// Tiered scorer — used as cmdk's custom filter. Same tier values as the
// scripts/palette-test.mjs harness (94+ cases passing).
// ---------------------------------------------------------------------------

const TIER_LABEL_EXACT       = 1_000_000
const TIER_LABEL_PREFIX      =   500_000
const TIER_LABEL_WORD_PREFIX =   100_000
const TIER_LABEL_SUBSTRING   =    50_000
const TIER_HINT_KEYWORD_HIT  =     1_000

const GROUP_BONUS: Record<PaletteItem['group'], number> = {
  'Quick actions': 50,
  Tasks: 30,
  Goals: 20,
  Pages: 10,
  Admin: 5,
}

interface ItemMeta {
  label: string
  hint?: string
  keywords?: string
  group: PaletteItem['group']
}

function scoreItem(query: string, meta: ItemMeta): number {
  const q = query.toLowerCase().trim()
  if (!q) return 0

  const label = meta.label.toLowerCase()
  const hint = (meta.hint ?? '').toLowerCase()
  const keywords = (meta.keywords ?? '').toLowerCase()

  const queryWords = q.split(/\s+/).filter(Boolean)
  if (queryWords.length === 0) return 0

  // HARD GATE: every query word must appear somewhere in label/hint/keywords.
  const haystack = `${label} ${hint} ${keywords}`
  for (const w of queryWords) {
    if (!haystack.includes(w)) return 0
  }

  let labelTier = 0
  if (label === q) {
    labelTier = TIER_LABEL_EXACT
  } else if (label.startsWith(q)) {
    labelTier = TIER_LABEL_PREFIX
  } else {
    const labelWords = label.split(/[\s/_\-.·:]+/).filter(Boolean)
    let hasWordPrefix = false
    for (const lw of labelWords) {
      for (const qw of queryWords) {
        if (lw.startsWith(qw)) {
          hasWordPrefix = true
          break
        }
      }
      if (hasWordPrefix) break
    }
    if (hasWordPrefix) {
      labelTier = TIER_LABEL_WORD_PREFIX
    } else {
      let allWordsInLabel = true
      for (const qw of queryWords) {
        if (!label.includes(qw)) {
          allWordsInLabel = false
          break
        }
      }
      if (allWordsInLabel) labelTier = TIER_LABEL_SUBSTRING
    }
  }

  const hitsHintOrKeyword = (() => {
    if (labelTier > 0) return false
    for (const qw of queryWords) {
      if (hint.includes(qw) || keywords.includes(qw)) return true
    }
    return false
  })()

  let score = 0
  if (labelTier > 0) {
    score = labelTier
    score -= Math.min(label.length, 100)
    if (hint.includes(q) || keywords.includes(q)) score += 100
  } else if (hitsHintOrKeyword) {
    score = TIER_HINT_KEYWORD_HIT
    score -= Math.min(label.length, 100)
  }
  return score + (GROUP_BONUS[meta.group] ?? 0)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommandPalette({
  open,
  onOpenChange,
  onStartTracking,
  onOpenCoach,
  onOpenCheckin,
}: CommandPaletteProps) {
  const router = useRouter()
  const isAdmin = useIsAdmin()
  const queryClient = useQueryClient()
  const { data: goals = [] } = useGoalsQuery()
  const { data: tasks = [] } = useTasksQuery()

  // Bump a counter every time the palette opens. We pass it into the
  // cmdk Command's `key` so the entire library state — search input,
  // selected item, expanded groups — is thrown away and rebuilt fresh
  // on every open. Eliminates the entire "stale state on reopen" class
  // of bugs that hand-rolled state kept reintroducing.
  const [openCounter, setOpenCounter] = useState(0)
  useEffect(() => {
    if (open) setOpenCounter((c) => c + 1)
  }, [open])

  // Refresh goals + tasks on every open so the just-created item is
  // searchable without requiring a full page refresh.
  useEffect(() => {
    if (!open) return
    queryClient.invalidateQueries({ queryKey: ['goals'] })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }, [open, queryClient])

  // Build the items list. Memoised on the queries + admin flag so we
  // don't rebuild on every keystroke (cmdk does its own re-render
  // cycle for the input value).
  const items = useMemo<PaletteItem[]>(() => {
    const quick: PaletteItem[] = []
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

    const goalItems: PaletteItem[] = (goals as Goal[]).map((g: Goal) => ({
      id: `goal-${g.id}`,
      label: g.title,
      hint: `Goal · ${g.category ?? 'uncategorised'}`,
      icon: Flag,
      group: 'Goals',
      keywords: g.category ?? '',
      href: `/dashboard/goals?goal=${encodeURIComponent(g.id)}`,
    }))

    const taskItems: PaletteItem[] = (tasks as Task[]).map((t: Task) => ({
      id: `task-${t.id}`,
      label: t.title,
      hint: t.goal?.title ? `Task · ${t.goal.title}` : 'Task',
      icon: CheckSquare,
      group: 'Tasks',
      keywords: `${t.goal?.title ?? ''} ${t.category ?? ''}`,
      href: `/dashboard/tasks?task=${encodeURIComponent(t.id)}`,
    }))

    return [...quick, ...PAGE_ITEMS, ...(isAdmin ? ADMIN_ITEMS : []), ...goalItems, ...taskItems]
  }, [goals, tasks, isAdmin, onStartTracking, onOpenCoach, onOpenCheckin])

  // Build a lookup so cmdk's filter (which only sees the item's `value`
  // prop) can find back to the item meta we need for tiered scoring.
  // The value passed to cmdk encodes the item id; we read meta from
  // here when the filter callback runs.
  const itemMeta = useMemo(() => {
    const m = new Map<string, ItemMeta>()
    for (const it of items) {
      m.set(it.id, { label: it.label, hint: it.hint, keywords: it.keywords, group: it.group })
    }
    return m
  }, [items])

  // cmdk filter signature: (value, search, keywords?) => score (0 = no match)
  // Higher score = ranked higher. We ignore the keywords arg cmdk passes
  // because we already plug everything we need into the scorer.
  const filter = useCallback(
    (value: string, search: string): number => {
      const meta = itemMeta.get(value)
      if (!meta) return 0
      return scoreItem(search, meta)
    },
    [itemMeta],
  )

  // Group items by their group field. The order of buckets matches
  // the order items are rendered for the empty/default state. cmdk
  // hides empty groups automatically when its filter returns 0 for
  // every item in them.
  const grouped = useMemo(() => {
    const order: PaletteItem['group'][] = ['Quick actions', 'Pages', 'Admin', 'Goals', 'Tasks']
    const buckets = new Map<PaletteItem['group'], PaletteItem[]>()
    for (const g of order) buckets.set(g, [])
    for (const it of items) buckets.get(it.group)?.push(it)
    return order
      .map((g) => ({ group: g, items: buckets.get(g) ?? [] }))
      .filter((b) => b.items.length > 0)
  }, [items])

  const handleSelect = useCallback(
    (item: PaletteItem) => {
      onOpenChange(false)
      // Defer to next tick so cmdk + dialog state flushes before nav.
      window.setTimeout(() => {
        if (item.onSelect) item.onSelect()
        else if (item.href) router.push(item.href)
      }, 0)
    },
    [onOpenChange, router],
  )

  const dismissRef = useDismissable<HTMLDivElement>(open, () => onOpenChange(false))

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-zinc-900/30 px-4 pt-[12vh] backdrop-blur-sm"
      role="presentation"
    >
      <div
        ref={dismissRef}
        className="w-full max-w-xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-zinc-900/5"
      >
        <Command
          // key={openCounter} forces cmdk to fully remount on each open
          // so search/selected/internal state can't bleed between sessions.
          key={openCounter}
          label="Command Palette"
          filter={filter}
          // Loop arrow keys (top -> bottom -> top) — small UX win.
          loop
          className="flex flex-col"
        >
          <PaletteHeader />

          <Command.List className="max-h-[60vh] overflow-y-auto py-1">
            <Command.Empty className="px-4 py-8 text-center text-sm text-zinc-500">
              Nothing matches. Try a different word.
            </Command.Empty>

            {grouped.map((bucket) => (
              <Command.Group
                key={bucket.group}
                heading={bucket.group}
                className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-zinc-400"
              >
                {bucket.items.map((it) => (
                  <CommandRowInner key={it.id} item={it} onSelect={() => handleSelect(it)} />
                ))}
              </Command.Group>
            ))}
          </Command.List>

          <PaletteFooter />
        </Command>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PaletteHeader() {
  return (
    <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2.5">
      <Search aria-hidden className="h-4 w-4 shrink-0 text-zinc-400" />
      <Command.Input
        autoFocus
        placeholder="Search pages, goals, tasks…  press Enter to open"
        className="h-7 w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
      />
      <kbd className="hidden shrink-0 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-500 sm:inline">
        Esc
      </kbd>
    </div>
  )
}

function PaletteFooter() {
  return (
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
  )
}

function CommandRowInner({
  item,
  onSelect,
}: {
  item: PaletteItem
  onSelect: () => void
}) {
  const Icon = item.icon
  const inner = (
    <>
      <Icon className="h-4 w-4 shrink-0 text-zinc-500 [&[data-selected=true]_&]:text-zinc-900" />
      <span className="min-w-0 flex-1 truncate text-sm text-zinc-900">{item.label}</span>
      {item.hint && (
        <span className="hidden truncate text-[11px] text-zinc-500 sm:inline">{item.hint}</span>
      )}
    </>
  )

  // For real links (Pages / Admin) we wrap in a Next Link inside the
  // Command.Item so cmd-click / middle-click open in new tab as
  // expected. Quick actions and dynamic goal/task entries just call
  // onSelect on cmdk's value-select event.
  const isLink = !!item.href && !item.onSelect && item.group !== 'Goals' && item.group !== 'Tasks'

  return (
    <Command.Item
      // cmdk uses `value` for filtering — we feed it the id and look
      // the meta back up in our custom filter via itemMeta map.
      value={item.id}
      onSelect={() => onSelect()}
      className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-zinc-50 data-[selected=true]:bg-[#fff7d1]"
    >
      {isLink && item.href ? (
        <Link
          href={item.href}
          onClick={(e) => {
            // Plain click goes through onSelect to close the palette;
            // cmd / ctrl / middle-click let the browser open in a new tab.
            if (e.metaKey || e.ctrlKey || e.button === 1) return
            e.preventDefault()
            onSelect()
          }}
          className="flex w-full items-center gap-2.5"
        >
          {inner}
        </Link>
      ) : (
        inner
      )}
    </Command.Item>
  )
}
