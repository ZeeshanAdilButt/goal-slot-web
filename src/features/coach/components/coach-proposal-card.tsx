import { useMemo, useState } from 'react'

import { type QueryClient, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  Edit3,
  Loader2,
  NotebookPen,
  Plus,
  ShieldCheck,
  Sparkles,
  Timer,
  TimerOff,
  Trash2,
  XCircle,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

import {
  coachApi,
  goalsApi,
  scheduleApi,
  timeEntriesApi,
  COACH_PROPOSAL_ACTION_TYPES,
  type CoachProposalAction,
  type CoachProposalActionType,
  type CoachProposalBlock,
  type CoachProposalResult,
} from '@/lib/api'
import { cn, formatDuration, formatTime12h } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const ACTION_META: Record<
  CoachProposalActionType,
  { label: string; verb: 'create' | 'update' | 'delete'; icon: typeof Plus }
> = {
  RENAME_GOAL: { label: 'Rename goal', verb: 'update', icon: Edit3 },
  UPDATE_GOAL: { label: 'Update goal', verb: 'update', icon: Edit3 },
  CREATE_GOAL: { label: 'Create goal', verb: 'create', icon: Plus },
  DELETE_GOAL: { label: 'Delete goal', verb: 'delete', icon: Trash2 },
  CREATE_SCHEDULE_BLOCK: { label: 'Add schedule block', verb: 'create', icon: CalendarPlus },
  UPDATE_SCHEDULE_BLOCK: { label: 'Update schedule block', verb: 'update', icon: Edit3 },
  DELETE_SCHEDULE_BLOCK: { label: 'Remove schedule block', verb: 'delete', icon: Trash2 },
  CREATE_TIME_ENTRY: { label: 'Log time', verb: 'create', icon: Plus },
  UPDATE_TIME_ENTRY: { label: 'Update time entry', verb: 'update', icon: Edit3 },
  DELETE_TIME_ENTRY: { label: 'Delete time entry', verb: 'delete', icon: Trash2 },
  CREATE_TASK: { label: 'Create task', verb: 'create', icon: Plus },
  UPDATE_TASK: { label: 'Update task', verb: 'update', icon: Edit3 },
  DELETE_TASK: { label: 'Delete task', verb: 'delete', icon: Trash2 },
  CREATE_PRACTICE: { label: 'Add active practice', verb: 'create', icon: Sparkles },
  // `update`, not `create`: it appends to a day's existing entry rather than
  // replacing it, and nothing is destroyed — so it must not trip the card's
  // "includes a delete" warning.
  APPEND_JOURNAL_ENTRY: { label: 'Add to journal', verb: 'update', icon: NotebookPen },
  // Neither of these is destructive: starting costs nothing, and stopping
  // SAVES the elapsed time rather than throwing it away. Keeping them off the
  // `delete` verb also keeps the card's "includes a delete" warning honest.
  START_TIMER: { label: 'Start live timer', verb: 'create', icon: Timer },
  STOP_TIMER: { label: 'Stop live timer', verb: 'update', icon: TimerOff },
}

// Verb pills share the dark brand pill so a proposal card doesn't read as
// a stack of emerald/sky/rose Bootstrap chips. Only `delete` keeps the
// rose tone because it's the platform-wide destructive cue (matches
// Button variant="destructive").
const VERB_CLASSES: Record<'create' | 'update' | 'delete', string> = {
  create: 'border-zinc-900 bg-zinc-900 text-[#f2cc0d]',
  update: 'border-zinc-900 bg-zinc-900 text-[#f2cc0d]',
  delete: 'border-rose-200 bg-rose-50 text-rose-700',
}

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Render a set of weekday numbers as a compact label for multi-day blocks:
// "every day", "weekdays", "weekends", or "Mon, Wed, Fri".
function formatDays(days: number[]): string | undefined {
  const uniq = Array.from(
    new Set(days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)),
  ).sort((a, b) => a - b)
  if (uniq.length === 0) return undefined
  if (uniq.length === 7) return 'every day'
  if (uniq.length === 5 && [1, 2, 3, 4, 5].every((d) => uniq.includes(d))) {
    return 'weekdays'
  }
  if (uniq.length === 2 && uniq.includes(0) && uniq.includes(6)) return 'weekends'
  return uniq.map((d) => DAYS_SHORT[d]).join(', ')
}

/** Look up an existing schedule block from the cached weekly schedule, by id. */
function findScheduleBlock(queryClient: QueryClient, id: string): any | undefined {
  const weekly = queryClient.getQueryData<Record<number, any[]>>(['schedule', 'weekly'])
  if (!weekly) return undefined
  for (const day of Object.values(weekly)) {
    if (!Array.isArray(day)) continue
    const hit = day.find((b: any) => b?.id === id)
    if (hit) return hit
  }
  return undefined
}

/** Look up an existing goal from any cached goal list, by id. */
function findGoal(queryClient: QueryClient, id: string): any | undefined {
  const lists = queryClient.getQueriesData<any[]>({ queryKey: ['goals'] })
  for (const [, data] of lists) {
    if (Array.isArray(data)) {
      const hit = data.find((g: any) => g?.id === id)
      if (hit) return hit
    }
  }
  return undefined
}

/**
 * Look up an existing time entry by id from any time-tracker query cache.
 * The proposal card eagerly fetches the last 30 days into the dedicated
 * `['time-tracker', 'coach-lookup']` key, but we also scan any other
 * time-tracker keys that may have a list of entries — saves a roundtrip
 * if the user came from the time tracker page where entries were already
 * loaded.
 */
function findTimeEntry(queryClient: QueryClient, id: string): any | undefined {
  const lists = queryClient.getQueriesData<any>({ queryKey: ['time-tracker'] })
  for (const [, data] of lists) {
    const candidates = Array.isArray(data) ? data : (data as any)?.items
    if (Array.isArray(candidates)) {
      const hit = candidates.find((e: any) => e?.id === id)
      if (hit) return hit
    }
  }
  return undefined
}

function fmtTimeRange(start: unknown, end: unknown): string | undefined {
  if (typeof start !== 'string' || typeof end !== 'string') return undefined
  return `${formatTime12h(start)} to ${formatTime12h(end)}`
}

/**
 * Coach often emits deadlines as full ISO strings (2026-08-28T00:00:00.000Z),
 * sometimes as plain YYYY-MM-DD. Render as "Aug 28, 2026" either way.
 */
function fmtDeadline(d: unknown): string | undefined {
  if (typeof d !== 'string') return undefined
  const parsed = new Date(d)
  if (Number.isNaN(parsed.getTime())) return d
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

interface DescribedAction {
  /** First line: the entity / subject of the action ("Arabic & Family"). */
  subject?: string
  /** Second line: what is changing or being created. */
  detail?: string
}

function describeAction(
  action: CoachProposalAction,
  queryClient: QueryClient,
): DescribedAction {
  const p = action.payload ?? {}
  const id = action.id

  switch (action.type) {
    case 'UPDATE_SCHEDULE_BLOCK':
    case 'DELETE_SCHEDULE_BLOCK': {
      const existing = id ? findScheduleBlock(queryClient, id) : undefined
      const subjectBits: string[] = []
      if (existing?.title) subjectBits.push(`"${existing.title}"`)
      if (typeof existing?.dayOfWeek === 'number') subjectBits.push(DAYS_SHORT[existing.dayOfWeek])
      const existingRange = fmtTimeRange(existing?.startTime, existing?.endTime)
      if (existingRange) subjectBits.push(existingRange)
      // If we can't resolve the block (cache miss / id Coach made up), fall
      // back to "Schedule block" instead of a scary "Block 3df269cf" hex
      // dump. The detail line still shows what's being changed, which is
      // what actually matters at approval time.
      const subject = subjectBits.length ? subjectBits.join(', ') : 'Schedule block'

      if (action.type === 'DELETE_SCHEDULE_BLOCK') return { subject, detail: 'Delete this block.' }

      // UPDATE: show the patch.
      const patchBits: string[] = []
      const newRange = fmtTimeRange(p.startTime, p.endTime)
      if (newRange) patchBits.push(`time to ${newRange}`)
      else if (typeof p.startTime === 'string') patchBits.push(`start to ${formatTime12h(p.startTime)}`)
      else if (typeof p.endTime === 'string') patchBits.push(`end to ${formatTime12h(p.endTime)}`)
      if (typeof p.title === 'string') patchBits.push(`title to "${p.title}"`)
      if (typeof p.dayOfWeek === 'number') patchBits.push(`day to ${DAYS_SHORT[p.dayOfWeek]}`)
      if (typeof p.category === 'string') patchBits.push(`category to ${p.category}`)
      if (typeof p.goalId === 'string') patchBits.push(`linked goal`)
      const detail = patchBits.length ? `Change ${patchBits.join(', ')}.` : 'Update this block.'
      return { subject, detail }
    }

    case 'CREATE_SCHEDULE_BLOCK': {
      const title = typeof p.title === 'string' ? `"${p.title}"` : 'New block'
      // Multi-day blocks arrive as daysOfWeek:number[]; single-day as dayOfWeek.
      const days = Array.isArray(p.daysOfWeek)
        ? (p.daysOfWeek as unknown[]).filter(
            (d): d is number => typeof d === 'number',
          )
        : typeof p.dayOfWeek === 'number'
          ? [p.dayOfWeek]
          : []
      const dayLabel = formatDays(days)
      const range = fmtTimeRange(p.startTime, p.endTime)
      const subject = [title, dayLabel, range].filter(Boolean).join(', ')
      return {
        subject,
        detail:
          days.length > 1
            ? `Add to your schedule on ${days.length} days.`
            : 'Add to your schedule.',
      }
    }

    case 'RENAME_GOAL':
    case 'UPDATE_GOAL':
    case 'DELETE_GOAL': {
      const existing = id ? findGoal(queryClient, id) : undefined
      const subject = existing?.title ? `"${existing.title}"` : id ? `Goal ${id.slice(0, 8)}` : undefined
      if (action.type === 'DELETE_GOAL') return { subject, detail: 'Delete this goal.' }
      const patchBits: string[] = []
      if (typeof p.title === 'string') patchBits.push(`title to "${p.title}"`)
      if (typeof p.description === 'string') patchBits.push('description')
      if (typeof p.targetHours === 'number') patchBits.push(`target to ${p.targetHours}h`)
      if (typeof p.deadline === 'string') patchBits.push(`deadline to ${fmtDeadline(p.deadline)}`)
      if (typeof p.category === 'string') patchBits.push(`category to ${p.category}`)
      const detail = patchBits.length ? `Change ${patchBits.join(', ')}.` : 'Update this goal.'
      return { subject, detail }
    }

    case 'CREATE_GOAL': {
      const title = typeof p.title === 'string' ? `"${p.title}"` : 'New goal'
      const deadlineLabel = fmtDeadline(p.deadline)
      const meta = [
        typeof p.targetHours === 'number' ? `${p.targetHours}h target` : null,
        deadlineLabel ? `by ${deadlineLabel}` : null,
        typeof p.category === 'string' ? p.category : null,
      ].filter(Boolean) as string[]
      return { subject: title, detail: meta.length ? meta.join(', ') : 'Create this goal.' }
    }

    case 'CREATE_PRACTICE': {
      const subject = typeof p.title === 'string' ? `"${p.title}"` : 'New practice'
      const detail = typeof p.body === 'string'
        ? p.body.length > 200 ? `${p.body.slice(0, 200)}...` : p.body
        : 'Add to your active practice.'
      return { subject, detail }
    }

    case 'APPEND_JOURNAL_ENTRY': {
      // The whole point of the card is reviewing the words before they land
      // in the journal, so the text itself is the subject rather than a
      // generic "Journal entry" label with the content hidden.
      const content = typeof p.content === 'string' ? p.content.trim() : ''
      const subject = content ? `"${content.length > 160 ? `${content.slice(0, 160)}...` : content}"` : 'Journal entry'

      const date = typeof p.date === 'string' ? p.date : undefined
      let when = "today's entry"
      if (date) {
        const d = new Date(`${date}T00:00:00`)
        when = Number.isNaN(d.getTime())
          ? `the entry for ${date}`
          : `the entry for ${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`
      }

      return { subject, detail: `Appends a paragraph to ${when}. Anything already written there is kept.` }
    }

    case 'CREATE_TIME_ENTRY': {
      const taskName = typeof p.taskName === 'string' ? p.taskName : 'Work'
      const duration = typeof p.duration === 'number' ? p.duration : undefined
      const date = typeof p.date === 'string' ? p.date : undefined
      const linkedGoalId = typeof p.goalId === 'string' ? p.goalId : undefined
      const linkedGoal = linkedGoalId ? findGoal(queryClient, linkedGoalId) : undefined

      const subject = `"${taskName}"`
      const bits: string[] = []
      if (duration !== undefined) {
        bits.push(formatDuration(duration))
      }
      if (date) {
        const d = new Date(`${date}T00:00:00`)
        bits.push(
          Number.isNaN(d.getTime())
            ? date
            : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
        )
      }
      if (linkedGoal?.title) bits.push(`linked to "${linkedGoal.title}"`)
      else if (linkedGoalId) bits.push('linked to a goal')
      if (typeof p.notes === 'string' && p.notes.trim()) {
        bits.push(p.notes.length > 60 ? `${p.notes.slice(0, 60)}...` : p.notes)
      }
      return { subject, detail: bits.join(', ') || 'Log this time entry.' }
    }
    case 'UPDATE_TIME_ENTRY':
    case 'DELETE_TIME_ENTRY': {
      // Look up the entry from the cache (the proposal card eagerly
      // preloads the last 200 recent entries on mount) and render its
      // task name + original date + duration as the subject. Falls
      // back to "Time entry" without an id slice — a meaningless hex
      // dump is worse than no detail, because the user can't act on it.
      const existing = id ? findTimeEntry(queryClient, id) : undefined
      const subjectBits: string[] = []
      if (existing?.taskName || existing?.taskTitle) {
        subjectBits.push(`"${existing.taskName || existing.taskTitle}"`)
      }
      if (typeof existing?.duration === 'number') {
        subjectBits.push(formatDuration(existing.duration as number))
      }
      if (typeof existing?.date === 'string') {
        const d = new Date(existing.date)
        if (!Number.isNaN(d.getTime())) {
          subjectBits.push(
            d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          )
        }
      }
      const subject = subjectBits.length ? subjectBits.join(' · ') : 'Time entry'

      if (action.type === 'DELETE_TIME_ENTRY') {
        return { subject, detail: 'Delete this entry.' }
      }

      // Pretty-print the new date so users see "Change date to May 29"
      // instead of "Change date to 2026-05-29".
      const fmtDate = (s: string): string => {
        const d = new Date(`${s}T00:00:00`)
        return Number.isNaN(d.getTime())
          ? s
          : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      }
      const bits: string[] = []
      if (typeof p.taskName === 'string') bits.push(`name to "${p.taskName}"`)
      if (typeof p.duration === 'number') bits.push(`duration to ${formatDuration(p.duration)}`)
      if (typeof p.date === 'string') bits.push(`date to ${fmtDate(p.date)}`)
      return { subject, detail: bits.length ? `Change ${bits.join(', ')}.` : 'Update this entry.' }
    }

    case 'START_TIMER': {
      // No duration here by design — START_TIMER drives the live stopwatch and
      // nobody knows how long it runs until the user stops it. What matters at
      // approval time is which goal it counts toward: Coach sends `goalId` when
      // it can see the goal in context, or the raw words the user said as
      // `goalName` for the API to resolve on apply.
      const linkedGoalId = typeof p.goalId === 'string' ? p.goalId : undefined
      const linkedGoal = linkedGoalId ? findGoal(queryClient, linkedGoalId) : undefined
      const spokenGoal = typeof p.goalName === 'string' ? p.goalName.trim() : ''
      const taskName = typeof p.taskName === 'string' ? p.taskName.trim() : ''
      const goalLabel = linkedGoal?.title || spokenGoal || undefined

      const name = taskName || goalLabel
      const subject = name ? `"${name}"` : 'Untitled session'

      const target = goalLabel
        ? `counting toward "${goalLabel}"`
        : linkedGoalId
          ? 'counting toward a linked goal'
          : "not linked to a goal, so the time won't count toward one"
      const sentences = [`Starts the clock now, ${target}.`, 'It runs until you stop it.']
      if (typeof p.notes === 'string' && p.notes.trim()) {
        const notes = p.notes.trim()
        sentences.push(`Note: ${notes.length > 60 ? `${notes.slice(0, 60)}...` : notes}`)
      }
      return { subject, detail: sentences.join(' ') }
    }

    case 'STOP_TIMER': {
      // Every field is optional and present only to OVERRIDE what the running
      // session already carries, so an empty payload is the normal case rather
      // than missing data. The subject stays generic on purpose: which timer is
      // running is server state we can't see from here, and naming an override
      // as if it were the session would be a lie at approval time.
      const linkedGoalId = typeof p.goalId === 'string' ? p.goalId : undefined
      const linkedGoal = linkedGoalId ? findGoal(queryClient, linkedGoalId) : undefined
      const spokenGoal = typeof p.goalName === 'string' ? p.goalName.trim() : ''
      const taskName = typeof p.taskName === 'string' ? p.taskName.trim() : ''
      const goalLabel = linkedGoal?.title || spokenGoal || undefined

      const overrides: string[] = []
      if (taskName) overrides.push(`name it "${taskName}"`)
      if (goalLabel) overrides.push(`count it toward "${goalLabel}"`)
      else if (linkedGoalId) overrides.push('count it toward a linked goal')
      if (typeof p.notes === 'string' && p.notes.trim()) overrides.push('attach a note')

      const sentences = ['Stops the running timer and saves the elapsed time as an entry.']
      if (overrides.length) sentences.push(`Also ${overrides.join(', ')}.`)
      return { subject: 'The running timer', detail: sentences.join(' ') }
    }

    case 'CREATE_TASK':
    case 'UPDATE_TASK':
    case 'DELETE_TASK': {
      const title = typeof p.title === 'string' ? `"${p.title}"` : id ? `Task ${id.slice(0, 8)}` : 'Task'
      return { subject: title, detail: action.type === 'DELETE_TASK' ? 'Delete this task.' : undefined }
    }

    default:
      return {}
  }
}

interface CoachProposalCardProps {
  block: CoachProposalBlock
  sourceMessageId?: string
}

const STORAGE_PREFIX = 'coach-proposal-state:'

interface PersistedProposalState {
  status: 'applied' | 'rejected'
  results?: CoachProposalResult[]
  appliedAt: number
}

function loadProposalState(key: string): PersistedProposalState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key)
    if (!raw) return null
    return JSON.parse(raw) as PersistedProposalState
  } catch {
    return null
  }
}

function saveProposalState(key: string, state: PersistedProposalState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(state))
  } catch {
    /* quota or disabled storage, ignore */
  }
}

function clearProposalState(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + key)
  } catch {
    /* ignore */
  }
}

export function CoachProposalCard({ block, sourceMessageId }: CoachProposalCardProps) {
  const queryClient = useQueryClient()

  // Stable key for this exact proposal block so apply/reject state survives
  // refreshes and re-renders. Uses sourceMessageId + a hash of the action
  // list so editing the conversation generates a new key.
  const stateKey = useMemo(() => {
    const fingerprint = block.actions
      .map((a) => `${a.type}:${a.id ?? ''}`)
      .join('|')
    return `${sourceMessageId ?? 'anon'}:${fingerprint}`
  }, [block.actions, sourceMessageId])

  // Eagerly populate the schedule + goals caches so describeAction can resolve
  // ids to "Qur'an Reading, Sun, 6:00 AM to 6:30 AM" even when the user hasn't
  // visited the Schedule or Goals page yet. A short staleTime (rather than 0 +
  // refetchOnMount: 'always') still guarantees a block Coach just
  // created/learned about in this conversation gets pulled in — fixes "Block
  // 3df269cf" fallback strings when some ids in the proposal aren't yet known
  // to the client cache — but without forcing a brand new network round trip
  // for every single proposal card. A conversation can render many of these
  // cards in quick succession (one per proposal block across several
  // messages); with staleTime 0 + refetchOnMount: 'always', each one indep-
  // endently refetched all three queries even when a sibling card fetched
  // the exact same data a moment earlier. 10s is long enough to cover a
  // burst of cards rendering together, short enough to still catch data
  // Coach only just mutated in this same session.
  useQuery({
    queryKey: ['schedule', 'weekly'],
    queryFn: async () => (await scheduleApi.getWeekly()).data,
    staleTime: 10_000,
  })
  useQuery({
    queryKey: ['goals', 'list', undefined],
    queryFn: async () => (await goalsApi.getAll({})).data,
    staleTime: 10_000,
  })
  // Eager fetch of the last 30 days of time entries so UPDATE_TIME_ENTRY
  // / DELETE_TIME_ENTRY proposals can render the entry's task name +
  // date + duration in the subject — previously they showed a meaningless
  // 8-char UUID slice ("Time entry 018b5aa9") and the user had no way
  // to verify which entry the AI picked before clicking Apply.
  useQuery({
    queryKey: ['time-tracker', 'coach-lookup'],
    queryFn: async () => {
      const res = await timeEntriesApi.getRecent({ page: 1, pageSize: 200 })
      const data = res.data as any
      return Array.isArray(data) ? data : data?.items ?? []
    },
    staleTime: 10_000,
  })
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(block.actions.map((_, i) => i)),
  )
  const [applying, setApplying] = useState(false)

  // Hydrate persisted state on mount so previously-applied/rejected proposals
  // show their final state when the user reopens the chat or refreshes.
  const persisted = useMemo(() => loadProposalState(stateKey), [stateKey])
  const [results, setResults] = useState<CoachProposalResult[] | null>(
    persisted?.status === 'applied' ? persisted.results ?? [] : null,
  )
  const [rejected, setRejected] = useState(persisted?.status === 'rejected')

  const hasDestructive = useMemo(
    () => block.actions.some((a) => ACTION_META[a.type]?.verb === 'delete'),
    [block.actions],
  )

  const toggle = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const handleApply = async () => {
    if (applying || results) return
    const toApply = block.actions.filter((_, i) => selected.has(i))
    if (!toApply.length) {
      toast.error('Nothing selected to apply.')
      return
    }
    setApplying(true)
    try {
      const res = await coachApi.applyProposals(toApply, sourceMessageId)
      setResults(res.data.results)
      saveProposalState(stateKey, {
        status: 'applied',
        results: res.data.results,
        appliedAt: Date.now(),
      })
      const okCount = res.data.results.filter((r) => r.ok).length
      const failCount = res.data.results.length - okCount
      if (failCount === 0) toast.success(`Applied ${okCount} change${okCount === 1 ? '' : 's'}.`)
      else if (okCount === 0) toast.error(`All ${failCount} change${failCount === 1 ? '' : 's'} failed.`)
      else toast.success(`Applied ${okCount}, ${failCount} failed, see card.`)

      // Invalidate everything that could have changed.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['goals'] }),
        queryClient.invalidateQueries({ queryKey: ['schedule'] }),
        queryClient.invalidateQueries({ queryKey: ['scheduleBlocks'] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['time-entries'] }),
        queryClient.invalidateQueries({ queryKey: ['timeEntries'] }),
        queryClient.invalidateQueries({ queryKey: ['coach', 'insights'] }),
        // APPEND_JOURNAL_ENTRY writes here; without this the Journal page
        // keeps showing the pre-append text until a manual reload, which
        // reads as "apply did nothing".
        queryClient.invalidateQueries({ queryKey: ['coach', 'journal', 'entries'] }),
      ])

      // Broadcast sync event to other open tabs
      if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
        try {
          const channel = new BroadcastChannel('goalslot-sync')
          channel.postMessage({ type: 'COACH_PROPOSAL_APPLIED' })
          channel.close()
        } catch {
          // Ignore broadcast errors
        }
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : 'Could not apply proposal'
      toast.error(m)
    } finally {
      setApplying(false)
    }
  }

  const resultByIndex = new Map<number, CoachProposalResult>()
  results?.forEach((r) => resultByIndex.set(r.index, r))

  return (
    <div className={cn(
      'my-3 overflow-hidden rounded-xl border bg-gradient-to-br shadow-sm transition-all',
      rejected
        ? 'border-zinc-200 from-zinc-50 to-white opacity-70'
        : 'border-[#f2cc0d]/40 from-[#fffbea] to-white',
    )}>
      <div className={cn(
        'flex items-start gap-2 border-b px-3 py-2',
        rejected ? 'border-zinc-200 bg-zinc-100' : 'border-[#f2cc0d]/30 bg-[#fff7d1]',
      )}>
        <ShieldCheck
          className={cn(
            'mt-0.5 h-4 w-4 flex-shrink-0',
            rejected ? 'text-zinc-400' : 'text-[#8a7307]',
          )}
          aria-hidden
        />
        <div className="flex-1">
          <div className={cn(
            'text-[11px] font-semibold uppercase tracking-wider',
            rejected ? 'text-zinc-500' : 'text-[#8a7307]',
          )}>
            {rejected
              ? 'Rejected, you can undo and apply'
              : results
                ? 'Coach proposed change, applied'
                : 'Coach proposed change, approval required'}
          </div>
          {block.summary && (
            <div className={cn(
              'mt-0.5 text-sm font-medium',
              rejected ? 'text-zinc-500 line-through' : 'text-zinc-900',
            )}>
              {block.summary}
            </div>
          )}
        </div>
      </div>

      <ul className="divide-y divide-zinc-100">
        {block.actions.map((action, i) => {
          const meta = ACTION_META[action.type] ?? {
            label: action.type,
            verb: 'update' as const,
            icon: Edit3,
          }
          const Icon = meta.icon
          const isChecked = selected.has(i)
          const result = resultByIndex.get(i)
          const { subject, detail } = describeAction(action, queryClient)

          return (
            <li key={i} className="flex items-start gap-3 px-3 py-2.5">
              {!results && !rejected && (
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(i)}
                  disabled={applying}
                  className="mt-1 h-4 w-4 rounded border-zinc-300 text-[#8a7307] focus:ring-[#f2cc0d]"
                  aria-label={`Include ${meta.label}`}
                />
              )}
              {rejected && (
                <div className="mt-0.5 h-4 w-4 shrink-0 rounded border border-zinc-300 bg-zinc-100" aria-hidden />
              )}
              {results && result && (
                <div className="mt-0.5">
                  {result.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-[#8a7307]" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-600" />
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                      VERB_CLASSES[meta.verb],
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {meta.label}
                  </span>
                </div>
                {subject && (
                  <div className="mt-0.5 truncate text-sm font-medium text-zinc-900">{subject}</div>
                )}
                {detail && (
                  <div className="mt-0.5 text-xs text-zinc-600">{detail}</div>
                )}
                {result && !result.ok && result.error && (
                  <div className="mt-0.5 text-xs text-rose-600">Failed: {result.error}</div>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {rejected && (
        <div className="flex items-center justify-between gap-2 border-t border-zinc-100 bg-zinc-50 px-3 py-2">
          <div className="text-xs text-zinc-500">You rejected this proposal.</div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setRejected(false)
              clearProposalState(stateKey)
            }}
          >
            Undo
          </Button>
        </div>
      )}
      {!results && !rejected && (
        <div className="flex items-center justify-between gap-2 border-t border-zinc-100 bg-white px-3 py-2">
          {hasDestructive ? (
            <div className="flex items-center gap-1 text-xs text-rose-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              Contains a delete, double-check before applying.
            </div>
          ) : (
            <div className="text-xs text-zinc-500">
              Nothing changes until you click Apply.
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setRejected(true)
                saveProposalState(stateKey, { status: 'rejected', appliedAt: Date.now() })
              }}
              disabled={applying}
            >
              Reject
            </Button>
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={handleApply}
              disabled={applying || selected.size === 0}
            >
              {applying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Apply {selected.size > 0 ? `(${selected.size})` : ''}
            </Button>
          </div>
        </div>
      )}
      {results && (
        <div className="border-t border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
          Done. Refresh Goals / Schedule to see the changes in their pages.
        </div>
      )}
    </div>
  )
}

/**
 * Extracts ```coach-proposal fenced blocks from raw assistant content.
 * Returns the cleaned content (with blocks removed) plus parsed blocks.
 *
 * Handles three streaming states:
 *  - closed block (```coach-proposal ... ```)           parsed into proposals, stripped from cleaned text
 *  - open block at end (model still streaming JSON)    stripped from cleaned text, `pending` flagged so UI shows a placeholder
 *  - opening fence partially typed (e.g. "```coach")   trimmed off the tail so the user never sees raw fence/JSON
 */
const VALID_ACTION_TYPES = new Set<string>(COACH_PROPOSAL_ACTION_TYPES)

// Common verbs the model reaches for that aren't the canonical names. Mapping
// them (instead of dropping) means a proposal survives when Gemini says
// "ADD_SCHEDULE_BLOCK" instead of "CREATE_SCHEDULE_BLOCK".
const ACTION_TYPE_SYNONYMS: Record<string, CoachProposalActionType> = {
  ADD_GOAL: 'CREATE_GOAL',
  NEW_GOAL: 'CREATE_GOAL',
  EDIT_GOAL: 'UPDATE_GOAL',
  MODIFY_GOAL: 'UPDATE_GOAL',
  REMOVE_GOAL: 'DELETE_GOAL',
  ADD_SCHEDULE_BLOCK: 'CREATE_SCHEDULE_BLOCK',
  NEW_SCHEDULE_BLOCK: 'CREATE_SCHEDULE_BLOCK',
  ADD_BLOCK: 'CREATE_SCHEDULE_BLOCK',
  EDIT_SCHEDULE_BLOCK: 'UPDATE_SCHEDULE_BLOCK',
  MODIFY_SCHEDULE_BLOCK: 'UPDATE_SCHEDULE_BLOCK',
  MOVE_SCHEDULE_BLOCK: 'UPDATE_SCHEDULE_BLOCK',
  UPDATE_BLOCK: 'UPDATE_SCHEDULE_BLOCK',
  REMOVE_SCHEDULE_BLOCK: 'DELETE_SCHEDULE_BLOCK',
  DELETE_BLOCK: 'DELETE_SCHEDULE_BLOCK',
  REMOVE_BLOCK: 'DELETE_SCHEDULE_BLOCK',
  ADD_TASK: 'CREATE_TASK',
  EDIT_TASK: 'UPDATE_TASK',
  REMOVE_TASK: 'DELETE_TASK',
  ADD_TIME_ENTRY: 'CREATE_TIME_ENTRY',
  EDIT_TIME_ENTRY: 'UPDATE_TIME_ENTRY',
  REMOVE_TIME_ENTRY: 'DELETE_TIME_ENTRY',
  ADD_PRACTICE: 'CREATE_PRACTICE',
  NEW_PRACTICE: 'CREATE_PRACTICE',
  // The live stopwatch is the one action users reach for by voice ("start
  // tracking my deen goal"), and dictated phrasing drifts further from the
  // canonical name than typed phrasing does. An unmapped type is dropped
  // silently, so the near-misses are worth spelling out.
  START_TRACKING: 'START_TIMER',
  BEGIN_TIMER: 'START_TIMER',
  TRACK_TIME: 'START_TIMER',
  STOP_TRACKING: 'STOP_TIMER',
  END_TIMER: 'STOP_TIMER',
}

/**
 * Coerce a model-emitted action type to a canonical one, or null if it can't be
 * mapped. Dropping the unmappable ones on the client is what keeps a single bad
 * type from 400-ing the entire apply batch on the server.
 */
export function normalizeCoachActionType(
  raw: unknown,
): CoachProposalActionType | null {
  if (typeof raw !== 'string') return null
  const key = raw.trim().toUpperCase()
  if (VALID_ACTION_TYPES.has(key)) return key as CoachProposalActionType
  if (key in ACTION_TYPE_SYNONYMS) return ACTION_TYPE_SYNONYMS[key]
  return null
}

// LLMs (GPT especially) often emit "JSON" with // or /* */ comments and
// trailing commas — both illegal, so JSON.parse throws and the whole proposal
// silently vanishes, leaving the user with prose and no approval card. Strip
// those tolerantly before parsing. String-aware, so "https://" and apostrophes
// inside string values are never touched.
function parseLenientJson(text: string): unknown {
  let out = ''
  let inStr = false
  let esc = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    const n = text[i + 1]
    if (inStr) {
      out += c
      if (esc) esc = false
      else if (c === '\\') esc = true
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') {
      inStr = true
      out += c
      continue
    }
    if (c === '/' && n === '/') {
      i += 2
      while (i < text.length && text[i] !== '\n') i++
      continue
    }
    if (c === '/' && n === '*') {
      i += 2
      while (i + 1 < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++
      i++
      continue
    }
    out += c
  }
  // Drop trailing commas before a closing } or ].
  out = out.replace(/,(\s*[}\]])/g, '$1')
  return JSON.parse(out)
}

// Collapse identical single-day CREATE_SCHEDULE_BLOCK actions (same title, time,
// category, goal) into one multi-day action carrying daysOfWeek. The model is
// asked to do this itself, but often emits one action per day anyway — a full
// week is then ~90+ actions, over the apply cap. Doing it here guarantees a week
// stays compact regardless of what the model emits, and the backend expands the
// daysOfWeek action into a recurring series.
function collapseMultiDayBlocks(
  actions: CoachProposalAction[],
): CoachProposalAction[] {
  const keyOf = (p: Record<string, unknown>) =>
    [p.title, p.startTime, p.endTime, p.category ?? '', p.goalId ?? ''].join('|')
  const isSingleDayBlock = (a: CoachProposalAction) => {
    const p = (a.payload ?? {}) as Record<string, unknown>
    return (
      a.type === 'CREATE_SCHEDULE_BLOCK' &&
      typeof p.dayOfWeek === 'number' &&
      !Array.isArray(p.daysOfWeek)
    )
  }

  const daysByKey = new Map<string, number[]>()
  for (const a of actions) {
    if (!isSingleDayBlock(a)) continue
    const p = a.payload as Record<string, unknown>
    const k = keyOf(p)
    const arr = daysByKey.get(k) ?? []
    arr.push(p.dayOfWeek as number)
    daysByKey.set(k, arr)
  }

  const emitted = new Set<string>()
  const out: CoachProposalAction[] = []
  for (const a of actions) {
    if (!isSingleDayBlock(a)) {
      out.push(a)
      continue
    }
    const p = a.payload as Record<string, unknown>
    const k = keyOf(p)
    if (emitted.has(k)) continue // a later duplicate folded into the group
    emitted.add(k)
    const days = Array.from(new Set(daysByKey.get(k) ?? [])).sort((x, y) => x - y)
    if (days.length > 1) {
      const { dayOfWeek: _drop, ...rest } = p
      out.push({ ...a, payload: { ...rest, daysOfWeek: days } })
    } else {
      out.push(a)
    }
  }
  return out
}

export function extractCoachProposals(raw: string): {
  cleaned: string
  proposals: CoachProposalBlock[]
  pending: boolean
} {
  if (!raw) return { cleaned: raw, proposals: [], pending: false }

  const proposals: CoachProposalBlock[] = []

  // 1. Pull out any fully-closed blocks.
  const closed = /```coach-proposal\s*\n([\s\S]*?)```/g
  let cleaned = raw.replace(closed, (_m, jsonText: string) => {
    try {
      const parsed = parseLenientJson(jsonText.trim()) as {
        actions?: unknown[]
        summary?: unknown
      }
      if (parsed && Array.isArray(parsed.actions) && parsed.actions.length) {
        // Normalize + validate types here so a hallucinated action (e.g.
        // "ADD_SCHEDULE_BLOCK") is either remapped or dropped, rather than sent
        // on to /apply where one bad type 400s the whole batch.
        const normalized = parsed.actions
          .filter((a: any) => a && typeof a === 'object')
          .map((a: any) => {
            const type = normalizeCoachActionType(a.type)
            return type ? { ...a, type } : null
          })
          .filter((a: any): a is CoachProposalAction => a !== null)
        // Fold per-day repeats into compact multi-day actions so a full week
        // fits under the apply cap even when the model emits one block per day.
        const actions = collapseMultiDayBlocks(normalized)
        if (actions.length) {
          proposals.push({
            summary:
              typeof parsed.summary === 'string' ? parsed.summary : undefined,
            actions,
          })
        }
      }
    } catch {
      /* malformed, drop silently */
    }
    return ''
  })

  // 2. Strip an open (unclosed) coach-proposal block at the tail of the stream.
  let pending = false
  const openIdx = cleaned.indexOf('```coach-proposal')
  if (openIdx !== -1) {
    cleaned = cleaned.slice(0, openIdx)
    pending = true
  } else {
    // 3. Strip a partially-typed opening fence like "``", "```", "```c", "```coach", etc.
    //    Only trim if it's at the very end of the buffer so we don't eat real backticks elsewhere.
    const partial = cleaned.match(/```[a-z-]{0,15}$/i)
    if (partial && /coach/i.test(partial[0] || '') === false && partial[0].length < 18) {
      // Probably the start of a coach-proposal opener. Hide the tail.
      const idx = cleaned.lastIndexOf(partial[0])
      if (idx !== -1) {
        cleaned = cleaned.slice(0, idx)
        pending = true
      }
    } else if (partial) {
      const idx = cleaned.lastIndexOf(partial[0])
      if (idx !== -1) {
        cleaned = cleaned.slice(0, idx)
        pending = true
      }
    }
  }

  return { cleaned: cleaned.trim(), proposals, pending }
}
