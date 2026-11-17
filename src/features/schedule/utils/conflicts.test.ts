import assert from 'node:assert/strict'

import { describe, test } from 'vitest'

import { describeConflict, findConflicts } from './conflicts.ts'
import type { ScheduleBlock, WeekSchedule } from './types.ts'

const block = (id: string, dayOfWeek: number, startTime: string, endTime: string, title = id): ScheduleBlock => ({
  id,
  title,
  startTime,
  endTime,
  dayOfWeek,
  category: 'work',
  color: '#FFD700',
  isRecurring: true,
  isPrivate: false,
  seriesId: 's1',
})

const week: WeekSchedule = {
  1: [block('mon', 1, '09:00', '10:00')],
  6: [block('sat-a', 6, '07:00', '07:30', 'Soft Skills Lab'), block('sat-b', 6, '12:00', '13:00')],
}

describe('findConflicts', () => {
  test('finds an overlap and names the day and block', () => {
    const found = findConflicts(week, [6], '07:15', '08:00')
    assert.equal(found.length, 1)
    assert.equal(found[0].day, 6)
    assert.equal(found[0].block.title, 'Soft Skills Lab')
  })

  test('touching edges do not overlap', () => {
    assert.deepEqual(findConflicts(week, [6], '07:30', '08:00'), [])
    assert.deepEqual(findConflicts(week, [6], '06:00', '07:00'), [])
  })

  test('a block fully containing another overlaps it', () => {
    assert.equal(findConflicts(week, [6], '06:00', '14:00').length, 2)
  })

  test('checks only the requested days', () => {
    assert.deepEqual(findConflicts(week, [2, 3], '09:00', '10:00'), [])
    assert.equal(findConflicts(week, [1, 6], '09:30', '09:45').length, 1)
  })

  test('skips excluded ids (the block being edited, or its whole series)', () => {
    assert.deepEqual(findConflicts(week, [6], '07:00', '07:30', new Set(['sat-a'])), [])
    assert.equal(findConflicts(week, [1, 6], '06:00', '14:00', new Set(['mon'])).length, 2)
    assert.equal(findConflicts(week, [1, 6], '06:00', '14:00', new Set(['mon', 'sat-a', 'sat-b'])).length, 0)
  })

  test('works with off-grid times', () => {
    const odd: WeekSchedule = { 2: [block('odd', 2, '04:20', '09:25')] }
    assert.equal(findConflicts(odd, [2], '09:00', '09:30').length, 1)
    assert.equal(findConflicts(odd, [2], '09:25', '09:30').length, 0)
  })

  test('returns nothing for an empty or reversed range, or an empty week', () => {
    assert.deepEqual(findConflicts(week, [6], '08:00', '07:00'), [])
    assert.deepEqual(findConflicts(week, [6], '07:00', '07:00'), [])
    assert.deepEqual(findConflicts(week, [6], '', '07:00'), [])
    assert.deepEqual(findConflicts({}, [6], '07:00', '08:00'), [])
  })

  test('lists conflicts in day order', () => {
    const found = findConflicts(week, [6, 1], '00:00', '23:59')
    assert.deepEqual(found.map((c) => c.day), [1, 6, 6])
  })
})

describe('describeConflict', () => {
  test('reads as a plain sentence', () => {
    const [conflict] = findConflicts(week, [6], '07:00', '07:30')
    assert.equal(describeConflict(conflict, '07:00', '07:30'), 'Sat 7:00 AM to 7:30 AM overlaps Soft Skills Lab')
  })
})
