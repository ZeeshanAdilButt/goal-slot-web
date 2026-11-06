import { describe, expect, it } from 'vitest'
import type { CoachProposalAction } from '@/lib/api'
import { buildProposalRows, formatDays, type KnownBlock } from './proposal-rows'

const blocks: Record<string, KnownBlock> = {
  r2: { title: 'Reading & Labs (Core Engineering)', dayOfWeek: 2, startTime: '07:00', endTime: '09:00' },
  r4: { title: 'Reading & Labs (Core Engineering)', dayOfWeek: 4, startTime: '07:00', endTime: '09:00' },
  dr0: { title: 'Deep Reading', dayOfWeek: 0, startTime: '07:00', endTime: '13:00' },
  dr6: { title: 'Deep Reading', dayOfWeek: 6, startTime: '07:00', endTime: '13:00' },
  car: { title: 'Career Strategy and Applications', dayOfWeek: 0, startTime: '13:00', endTime: '15:00' },
  bra: { title: 'Branding and Great Content', dayOfWeek: 6, startTime: '13:00', endTime: '15:00' },
  old: { title: 'Old', dayOfWeek: 1, startTime: '09:00', endTime: '10:00' },
}
for (const d of [0, 1, 2, 3, 4, 5, 6]) {
  blocks[`ct${d}`] = { title: 'Community Time', dayOfWeek: d, startTime: '16:00', endTime: '17:00' }
}
const find = (id: string) => blocks[id]

const upd = (id: string, payload: Record<string, unknown>, expectedTitle?: string): CoachProposalAction => ({
  type: 'UPDATE_SCHEDULE_BLOCK',
  id,
  payload,
  ...(expectedTitle ? { expectedTitle } : {}),
})

// The shape the API guard emits for the production weekend request.
const actions: CoachProposalAction[] = [
  upd('r2', { title: 'Core Engineering', startTime: '07:00', endTime: '08:00' }),
  upd('r4', { title: 'Core Engineering', startTime: '07:00', endTime: '08:00' }),
  { type: 'CREATE_SCHEDULE_BLOCK', payload: { title: 'Soft Skills Lab', startTime: '08:00', endTime: '08:30', daysOfWeek: [2, 4], category: 'LEARNING' } },
  { type: 'CREATE_SCHEDULE_BLOCK', payload: { title: 'Tech Lab', startTime: '08:30', endTime: '09:00', daysOfWeek: [2, 4], category: 'LEARNING' } },
  ...[0, 1, 2, 3, 4, 5, 6].map((d) => upd(`ct${d}`, { title: 'Dev Weekends' }, 'Community Time')),
  upd('dr0', { startTime: '09:00', endTime: '12:00' }),
  upd('dr6', { startTime: '09:00', endTime: '12:00' }),
  upd('car', { startTime: '07:00', endTime: '08:00' }),
  upd('bra', { startTime: '07:00', endTime: '08:00' }),
  { type: 'CREATE_SCHEDULE_BLOCK', payload: { title: 'Founder Interviews Prep', startTime: '08:00', endTime: '09:00', daysOfWeek: [0, 6], category: 'WORK' } },
  upd('ghost', { title: 'X' }, 'Ghost'),
  { type: 'CREATE_GOAL', payload: { title: 'Labs' } },
  { type: 'DELETE_SCHEDULE_BLOCK', id: 'old', expectedTitle: 'Old' },
]

describe('buildProposalRows', () => {
  const rows = buildProposalRows(actions, find)
  const lines = rows.map((r) => r.line)

  it('turns 20 actions into one row per change', () => {
    expect(lines).toEqual([
      'Tue, Thu: "Reading & Labs (Core Engineering)" 7:00 AM to 9:00 AM becomes Core Engineering 7:00 AM to 8:00 AM, Soft Skills Lab 8:00 AM to 8:30 AM, Tech Lab 8:30 AM to 9:00 AM',
      'Every day: "Community Time" 4:00 PM to 5:00 PM, renamed to "Dev Weekends"',
      'Sat, Sun: "Deep Reading" 7:00 AM to 1:00 PM, now 9:00 AM to 12:00 PM',
      'Sun: "Career Strategy and Applications" 1:00 PM to 3:00 PM, now 7:00 AM to 8:00 AM',
      'Sat: "Branding and Great Content" 1:00 PM to 3:00 PM, now 7:00 AM to 8:00 AM',
      'Sat, Sun: add "Founder Interviews Prep" 8:00 AM to 9:00 AM',
      null,
      null,
      'Mon: remove "Old" 9:00 AM to 10:00 AM',
    ])
  })

  it('keeps every action in exactly one row, so selection and results still cover the batch', () => {
    const covered = rows.flatMap((r) => r.indices).sort((a, b) => a - b)
    expect(covered).toEqual(actions.map((_, i) => i))
  })

  it('does not fold a new block into a block that only moved within its old window', () => {
    const dr = rows.find((r) => r.line?.includes('Deep Reading'))!
    expect(dr.verb).toBe('update')
    expect(dr.indices).toEqual([11, 12])
  })

  it('never merges an action whose id is unknown or whose title does not match', () => {
    const mismatch = buildProposalRows([upd('r2', { title: 'A' }, 'Work'), upd('r4', { title: 'A' })], find)
    expect(mismatch.map((r) => r.line)).toEqual([null, 'Thu: "Reading & Labs (Core Engineering)" 7:00 AM to 9:00 AM, renamed to "A"'])
  })
})

describe('formatDays', () => {
  it('names the common ranges', () => {
    expect(formatDays([1, 2, 3, 4, 5])).toBe('Mon to Fri')
    expect(formatDays([6, 0])).toBe('Sat, Sun')
    expect(formatDays([0, 1, 2, 3, 4, 5, 6])).toBe('Every day')
    expect(formatDays([0, 2, 4])).toBe('Tue, Thu, Sun')
  })
})

describe('series-scoped updates', () => {
  const book: Record<string, KnownBlock> = {}
  for (const d of [2, 3, 4, 5]) {
    book[`b${d}`] = { title: 'Book', dayOfWeek: d, startTime: '09:00', endTime: '11:00', seriesId: 'book-series' }
  }
  const lab: KnownBlock = { title: 'Labs', dayOfWeek: 1, startTime: '07:00', endTime: '09:00', seriesId: 'lab-series' }
  const labTue: KnownBlock = { ...lab, dayOfWeek: 2 }
  const all: Record<string, KnownBlock> = { ...book, l1: lab, l2: labTue }
  const findB = (id: string) => all[id]
  const series = (sid: string) => Object.values(all).filter((b) => b.seriesId === sid)

  it('shows a series rename on every day of the series, not the one id it was sent on', () => {
    const rows = buildProposalRows([upd('b2', { title: 'Study', updateScope: 'series' }, 'Book')], findB, series)
    expect(rows[0].line).toBe('Tue, Wed, Thu, Fri: "Book" 9:00 AM to 11:00 AM, renamed to "Study"')
  })

  it('shows a series time change on every day of the series', () => {
    const rows = buildProposalRows([upd('b3', { startTime: '08:00', endTime: '11:00', updateScope: 'series' })], findB, series)
    expect(rows[0].line).toBe('Tue, Wed, Thu, Fri: "Book" 9:00 AM to 11:00 AM, now 8:00 AM to 11:00 AM')
  })

  it('says "every day of this series" when the series is not in the cache, never one day', () => {
    const rows = buildProposalRows([upd('b2', { title: 'Study', updateScope: 'series' })], findB, () => [])
    expect(rows[0].line).toBe('Every day of this series: "Book" 9:00 AM to 11:00 AM, renamed to "Study"')
  })

  it('folds a split into a series-scoped update on all the series days', () => {
    const rows = buildProposalRows(
      [
        upd('l1', { title: 'Core Engineering', startTime: '07:00', endTime: '08:00', updateScope: 'series' }),
        { type: 'CREATE_SCHEDULE_BLOCK', payload: { title: 'Soft Skills Lab', startTime: '08:00', endTime: '09:00', daysOfWeek: [1, 2] } },
      ],
      findB,
      series,
    )
    expect(rows.map((r) => r.line)).toEqual([
      'Mon, Tue: "Labs" 7:00 AM to 9:00 AM becomes Core Engineering 7:00 AM to 8:00 AM, Soft Skills Lab 8:00 AM to 9:00 AM',
    ])
  })

  it('does not fold into a series update whose days are unknown', () => {
    const rows = buildProposalRows(
      [
        upd('l1', { title: 'Core Engineering', startTime: '07:00', endTime: '08:00', updateScope: 'series' }),
        { type: 'CREATE_SCHEDULE_BLOCK', payload: { title: 'Soft Skills Lab', startTime: '08:00', endTime: '09:00', dayOfWeek: 1 } },
      ],
      findB,
      () => [],
    )
    expect(rows).toHaveLength(2)
    expect(rows[0].line).toMatch(/^Every day of this series:/)
  })
})

describe('grouping edge cases (CodeRabbit #357)', () => {
  const two: Record<string, KnownBlock> = {
    a: { title: 'Gym', dayOfWeek: 1, startTime: '18:00', endTime: '19:00' },
    b: { title: 'Gym', dayOfWeek: 1, startTime: '18:00', endTime: '19:00' },
    x: { title: 'Labs', dayOfWeek: 2, startTime: '07:00', endTime: '09:00' },
    y: { title: 'Labs', dayOfWeek: 2, startTime: '07:00', endTime: '09:00' },
  }
  const f = (id: string) => two[id]

  it('keeps two same-title, same-time blocks on the same day as two rows', () => {
    const rows = buildProposalRows([upd('a', { title: 'Lift' }), upd('b', { title: 'Lift' })], f)
    expect(rows).toHaveLength(2)
  })

  it('keeps creates that link to different goals as separate rows', () => {
    const c = (goalId: string): CoachProposalAction => ({
      type: 'CREATE_SCHEDULE_BLOCK',
      payload: { title: 'Read', startTime: '20:00', endTime: '21:00', dayOfWeek: 1, goalId },
    })
    expect(buildProposalRows([c('g1'), { ...c('g2'), payload: { ...c('g2').payload, dayOfWeek: 2 } }], f)).toHaveLength(2)
  })

  it('does not fold a create that two different updates could own', () => {
    const rows = buildProposalRows(
      [
        upd('x', { title: 'A', startTime: '07:00', endTime: '08:00' }),
        upd('y', { title: 'B', startTime: '07:00', endTime: '08:00' }),
        { type: 'CREATE_SCHEDULE_BLOCK', payload: { title: 'Lab', startTime: '08:00', endTime: '09:00', dayOfWeek: 2 } },
      ],
      f,
    )
    expect(rows.find((r) => r.indices.includes(2))!.indices).toEqual([2])
  })

  it('does not treat an update that moves day as an in-place split', () => {
    const rows = buildProposalRows(
      [
        upd('x', { startTime: '07:00', endTime: '08:00', dayOfWeek: 3 }),
        { type: 'CREATE_SCHEDULE_BLOCK', payload: { title: 'Lab', startTime: '08:00', endTime: '09:00', dayOfWeek: 2 } },
      ],
      f,
    )
    expect(rows).toHaveLength(2)
  })
})
