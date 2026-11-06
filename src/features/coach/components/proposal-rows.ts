import type { CoachProposalAction } from '@/lib/api'

/**
 * Lean card rows: one line per CHANGE, not one per action.
 *
 * A real proposal renamed "Community Time" to "Dev Weekends" as seven
 * separate actions (one per day), and a split of "Reading & Labs" arrived as
 * two updates plus two multi-day creates. Shown one row each, that is eleven
 * near-identical rows the user has to read to find out it is two changes.
 * Grouped, it reads the way the user asked for it:
 *
 *   Every day: "Community Time" renamed to "Dev Weekends"
 *   Tue, Thu: "Reading & Labs" 7:00 AM to 9:00 AM becomes Core Engineering
 *     7:00 AM to 8:00 AM, Soft Skills Lab 8:00 AM to 8:30 AM, Tech Lab ...
 *
 * Pure, so it is unit tested without rendering. Actions it cannot place
 * (non-schedule actions, or a schedule action whose block is unknown) come
 * back as single rows and the card describes them the way it always has.
 */

export interface KnownBlock {
  title: string
  dayOfWeek: number
  startTime: string
  endTime: string
  seriesId?: string | null
}

export interface ProposalRow {
  /** Indexes into the proposal's actions that this row stands for. */
  indices: number[]
  /** null: not grouped, render the action the usual way. */
  line: string | null
  /** The verb shown on the row's badge. */
  verb: 'create' | 'update' | 'delete' | 'restructure' | null
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function formatDays(days: number[]): string {
  const set = new Set(days)
  if (set.size === 7) return 'Every day'
  if (set.size === 5 && [1, 2, 3, 4, 5].every((d) => set.has(d))) return 'Mon to Fri'
  if (set.size === 2 && set.has(0) && set.has(6)) return 'Sat, Sun'
  return WEEK_ORDER.filter((d) => set.has(d))
    .map((d) => DAY_SHORT[d])
    .join(', ')
}

function hhmm(t: unknown): t is string {
  return typeof t === 'string' && /^([01]?\d|2[0-3]):[0-5]\d$/.test(t)
}

function fmt(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${suffix}`
}

function range(start: string, end: string): string {
  return `${fmt(start)} to ${fmt(end)}`
}

function norm(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ')
}

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

interface Group {
  indices: number[]
  days: number[]
  kind: 'create' | 'update' | 'delete'
  title: string
  start?: string
  end?: string
  payload: Record<string, unknown>
  absorbed: Group[]
  /** A series-scoped update whose other days could not be found in the cache. */
  seriesUnresolved?: boolean
}

function stable(payload: Record<string, unknown>): string {
  return JSON.stringify(
    Object.keys(payload)
      .sort()
      .map((k) => [k, payload[k]]),
  )
}

function createDays(p: Record<string, unknown>): number[] {
  if (Array.isArray(p.daysOfWeek)) {
    return p.daysOfWeek.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6)
  }
  return typeof p.dayOfWeek === 'number' ? [p.dayOfWeek] : []
}

function describeUpdate(g: Group): string {
  const p = g.payload
  const bits: string[] = []
  if (typeof p.title === 'string' && norm(p.title) !== norm(g.title)) bits.push(`renamed to "${p.title}"`)
  if (hhmm(p.startTime) || hhmm(p.endTime)) {
    const s = hhmm(p.startTime) ? p.startTime : g.start
    const e = hhmm(p.endTime) ? p.endTime : g.end
    if (s && e) bits.push(`now ${range(s, e)}`)
  }
  // A series update never moves a day (the API drops dayOfWeek for it).
  if (typeof p.dayOfWeek === 'number' && p.updateScope !== 'series') bits.push(`moves to ${DAY_SHORT[p.dayOfWeek]}`)
  if (typeof p.goalId === 'string') bits.push('linked to a goal')
  if (typeof p.category === 'string') bits.push(`category ${p.category}`)
  return bits.length ? bits.join(', ') : 'updated'
}

export function buildProposalRows(
  actions: CoachProposalAction[],
  findBlock: (id: string) => KnownBlock | undefined,
  /** Every cached block in a series. Needed to show a series-scoped update on all its days. */
  findSeries: (seriesId: string) => KnownBlock[] = () => [],
): ProposalRow[] {
  const groups = new Map<string, Group>()
  const singles: number[] = []

  actions.forEach((a, i) => {
    const p = (a.payload ?? {}) as Record<string, unknown>
    if (a.type === 'CREATE_SCHEDULE_BLOCK') {
      const days = createDays(p)
      if (typeof p.title !== 'string' || !hhmm(p.startTime) || !hhmm(p.endTime) || days.length === 0) {
        singles.push(i)
        return
      }
      const key = `C|${p.title}|${p.startTime}|${p.endTime}|${String(p.category ?? '')}`
      const g = groups.get(key) ?? {
        indices: [],
        days: [],
        kind: 'create' as const,
        title: p.title,
        start: p.startTime,
        end: p.endTime,
        payload: p,
        absorbed: [],
      }
      g.indices.push(i)
      g.days.push(...days)
      groups.set(key, g)
      return
    }
    if (a.type === 'UPDATE_SCHEDULE_BLOCK' || a.type === 'DELETE_SCHEDULE_BLOCK') {
      const block = a.id ? findBlock(a.id) : undefined
      if (!block || (a.expectedTitle && norm(a.expectedTitle) !== norm(block.title))) {
        // Unknown or mismatched: never merge it with real rows. The card's
        // single-row path shows its own "not found" warning for it.
        singles.push(i)
        return
      }
      const kind = a.type === 'DELETE_SCHEDULE_BLOCK' ? 'delete' : 'update'
      // updateScope "series" on ONE id changes every block in that series, so
      // the row must name all of those days. Showing only the id's own day
      // ("Tue: Book renamed to Study" for a Tue to Fri series) tells the user
      // the opposite of what Apply does. If the series cannot be resolved from
      // the cache, say so rather than naming a single day.
      const seriesScoped = kind === 'update' && p.updateScope === 'series'
      const members = seriesScoped && block.seriesId ? findSeries(block.seriesId) : []
      const days = seriesScoped && members.length ? members.map((m) => m.dayOfWeek) : [block.dayOfWeek]
      const seriesUnresolved = seriesScoped && members.length === 0
      const key = `${kind}|${norm(block.title)}|${block.startTime}|${block.endTime}|${stable(p)}|${seriesUnresolved ? `unresolved:${a.id}` : ''}`
      const g = groups.get(key) ?? {
        indices: [],
        days: [],
        kind,
        title: block.title,
        start: block.startTime,
        end: block.endTime,
        payload: p,
        absorbed: [],
        seriesUnresolved,
      }
      g.indices.push(i)
      g.days.push(...days)
      groups.set(key, g)
      return
    }
    singles.push(i)
  })

  // A split arrives as an update that shrinks a block plus creates inside the
  // time it gave up, on the same days. Fold those creates into the update so
  // the row reads as one restructure of that block.
  const all = [...groups.values()]
  const daysKey = (g: Group) => [...new Set(g.days)].sort().join()
  for (const u of all) {
    if (u.kind !== 'update' || !u.start || !u.end) continue
    if (!hhmm(u.payload.startTime) && !hhmm(u.payload.endTime)) continue
    // Days unknown: a fold would claim the pieces line up with days we cannot see.
    if (u.seriesUnresolved) continue
    const candidates = all.filter(
      (c) =>
        c.kind === 'create' &&
        !all.some((x) => x.absorbed.includes(c)) &&
        daysKey(c) === daysKey(u) &&
        toMin(c.start!) >= toMin(u.start!) &&
        toMin(c.end!) <= toMin(u.end!),
    )
    if (candidates.length === 0) continue
    // Only a real split folds: the pieces run back to back from the block's
    // original start. A block that merely moves within its old window (Deep
    // Reading 7 to 1 becoming 9 to 12) must not swallow an unrelated new block
    // that happens to land in the time it gave up.
    const s = hhmm(u.payload.startTime) ? u.payload.startTime : u.start
    const e = hhmm(u.payload.endTime) ? u.payload.endTime : u.end
    const chain = [{ start: s, end: e }, ...candidates.map((c) => ({ start: c.start!, end: c.end! }))].sort(
      (x, y) => toMin(x.start) - toMin(y.start),
    )
    const contiguous =
      chain[0].start === u.start && chain.every((x, k) => k === 0 || x.start === chain[k - 1].end)
    if (contiguous) u.absorbed.push(...candidates)
  }
  const absorbed = new Set(all.flatMap((g) => g.absorbed))

  const rows: ProposalRow[] = []
  for (const g of all) {
    if (absorbed.has(g)) continue
    const days = g.seriesUnresolved ? 'Every day of this series' : formatDays(g.days)
    if (g.kind === 'create') {
      rows.push({ indices: g.indices, verb: 'create', line: `${days}: add "${g.title}" ${range(g.start!, g.end!)}` })
    } else if (g.kind === 'delete') {
      rows.push({ indices: g.indices, verb: 'delete', line: `${days}: remove "${g.title}" ${range(g.start!, g.end!)}` })
    } else if (g.absorbed.length) {
      const s = hhmm(g.payload.startTime) ? g.payload.startTime : g.start!
      const e = hhmm(g.payload.endTime) ? g.payload.endTime : g.end!
      const first = typeof g.payload.title === 'string' ? g.payload.title : g.title
      const pieces = [
        { title: first, start: s, end: e },
        ...g.absorbed.map((c) => ({ title: c.title, start: c.start!, end: c.end! })),
      ].sort((x, y) => toMin(x.start) - toMin(y.start))
      rows.push({
        indices: [...g.indices, ...g.absorbed.flatMap((c) => c.indices)].sort((x, y) => x - y),
        verb: 'restructure',
        line:
          `${days}: "${g.title}" ${range(g.start!, g.end!)} becomes ` +
          pieces.map((x) => `${x.title} ${range(x.start, x.end)}`).join(', '),
      })
    } else {
      rows.push({
        indices: g.indices,
        verb: 'update',
        line: `${days}: "${g.title}" ${range(g.start!, g.end!)}, ${describeUpdate(g)}`,
      })
    }
  }
  for (const i of singles) rows.push({ indices: [i], line: null, verb: null })
  return rows.sort((a, b) => a.indices[0] - b.indices[0])
}
