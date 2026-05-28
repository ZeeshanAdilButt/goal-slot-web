import { useMemo, useState } from 'react'

import { type QueryClient, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

import {
  coachApi,
  goalsApi,
  scheduleApi,
  type CoachProposalAction,
  type CoachProposalActionType,
  type CoachProposalBlock,
  type CoachProposalResult,
} from '@/lib/api'
import { cn, formatTime12h } from '@/lib/utils'

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
}

const VERB_CLASSES: Record<'create' | 'update' | 'delete', string> = {
  create: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  update: 'border-sky-200 bg-sky-50 text-sky-700',
  delete: 'border-rose-200 bg-rose-50 text-rose-700',
}

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
      const subject = subjectBits.length ? subjectBits.join(', ') : id ? `Block ${id.slice(0, 8)}` : undefined

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
      const day = typeof p.dayOfWeek === 'number' ? DAYS_SHORT[p.dayOfWeek] : undefined
      const range = fmtTimeRange(p.startTime, p.endTime)
      const subject = [title, day, range].filter(Boolean).join(', ')
      return { subject, detail: 'Add to your schedule.' }
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

    case 'CREATE_TIME_ENTRY': {
      const taskName = typeof p.taskName === 'string' ? p.taskName : 'Work'
      const duration = typeof p.duration === 'number' ? p.duration : undefined
      const date = typeof p.date === 'string' ? p.date : undefined
      const linkedGoalId = typeof p.goalId === 'string' ? p.goalId : undefined
      const linkedGoal = linkedGoalId ? findGoal(queryClient, linkedGoalId) : undefined

      const subject = `"${taskName}"`
      const bits: string[] = []
      if (duration !== undefined) {
        const h = Math.floor(duration / 60)
        const m = duration % 60
        bits.push(
          h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`,
        )
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
      const subject = id ? `Time entry ${id.slice(0, 8)}` : 'Time entry'
      if (action.type === 'DELETE_TIME_ENTRY') return { subject, detail: 'Delete this entry.' }
      const bits: string[] = []
      if (typeof p.taskName === 'string') bits.push(`name to "${p.taskName}"`)
      if (typeof p.duration === 'number') bits.push(`duration to ${p.duration}m`)
      if (typeof p.date === 'string') bits.push(`date to ${p.date}`)
      return { subject, detail: bits.length ? `Change ${bits.join(', ')}.` : 'Update this entry.' }
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

export function CoachProposalCard({ block, sourceMessageId }: CoachProposalCardProps) {
  const queryClient = useQueryClient()

  // Eagerly populate the schedule + goals caches so describeAction can resolve
  // ids to "Qur'an Reading, Sun, 6:00 AM to 6:30 AM" even when the user hasn't
  // visited the Schedule or Goals page yet in this session. Both queries are
  // staleTime: long so they don't refetch on every card mount.
  useQuery({
    queryKey: ['schedule', 'weekly'],
    queryFn: async () => (await scheduleApi.getWeekly()).data,
    staleTime: 60_000,
  })
  useQuery({
    queryKey: ['goals', 'list', undefined],
    queryFn: async () => (await goalsApi.getAll({})).data,
    staleTime: 60_000,
  })
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(block.actions.map((_, i) => i)),
  )
  const [applying, setApplying] = useState(false)
  const [results, setResults] = useState<CoachProposalResult[] | null>(null)
  const [rejected, setRejected] = useState(false)

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
      ])
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
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-600" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
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
          <button
            type="button"
            onClick={() => setRejected(false)}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Undo
          </button>
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
            <button
              type="button"
              onClick={() => setRejected(true)}
              disabled={applying}
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={applying || selected.size === 0}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#f2cc0d] px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-sm hover:bg-[#dfb90c] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {applying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Apply {selected.size > 0 ? `(${selected.size})` : ''}
            </button>
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
      const parsed = JSON.parse(jsonText.trim())
      if (parsed && Array.isArray(parsed.actions) && parsed.actions.length) {
        proposals.push({
          summary: typeof parsed.summary === 'string' ? parsed.summary : undefined,
          actions: parsed.actions.filter(
            (a: any) => a && typeof a === 'object' && typeof a.type === 'string',
          ),
        })
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
