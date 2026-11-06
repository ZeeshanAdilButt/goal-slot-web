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
