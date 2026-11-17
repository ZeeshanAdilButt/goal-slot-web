import assert from 'node:assert/strict'

import { describe, test } from 'vitest'

import { hasFieldChanges } from './block-edit.ts'
import { diffDays, formatDayList, getSeriesBlocks, replaceDay, seriesDays, summarizeDayDiff } from './day-set.ts'
import type { ScheduleBlock, WeekSchedule } from './types.ts'

const block = (over: Partial<ScheduleBlock> & { id: string; dayOfWeek: number }): ScheduleBlock => ({
  title: 'Deep Work',
  startTime: '09:00',
  endTime: '10:00',
  category: 'work',
  color: '#FFD700',
  isRecurring: true,
  isPrivate: false,
  seriesId: 's1',
  ...over,
})

describe('diffDays', () => {
  test('reports added and removed days in week order', () => {
    assert.deepEqual(diffDays([6, 5], [6, 4, 3]), { added: [3, 4], removed: [5] })
  })

  test('no change gives empty lists', () => {
    assert.deepEqual(diffDays([1, 2], [2, 1]), { added: [], removed: [] })
  })

  test('ignores duplicates', () => {
    assert.deepEqual(diffDays([1], [1, 1, 2, 2]), { added: [2], removed: [] })
  })
})

describe('summarizeDayDiff', () => {
  test('adds and removes', () => {
    assert.equal(summarizeDayDiff({ added: [3, 4], removed: [5] }), 'Adds Wed, Thu. Removes Fri.')
  })
  test('adds only', () => {
    assert.equal(summarizeDayDiff({ added: [3], removed: [] }), 'Adds Wed.')
  })
  test('removes only', () => {
    assert.equal(summarizeDayDiff({ added: [], removed: [0, 6] }), 'Removes Sun, Sat.')
  })
  test('empty when nothing changes', () => {
    assert.equal(summarizeDayDiff({ added: [], removed: [] }), '')
  })
})

describe('formatDayList', () => {
  test('sorts and names days', () => {
    assert.equal(formatDayList([3, 1, 2]), 'Mon, Tue, Wed')
  })
})

describe('series helpers', () => {
  const week: WeekSchedule = {
    1: [block({ id: 'a', dayOfWeek: 1 })],
    3: [block({ id: 'b', dayOfWeek: 3 }), block({ id: 'x', dayOfWeek: 3, seriesId: 'other' })],
    6: [block({ id: 'c', dayOfWeek: 6 })],
  }

  test('getSeriesBlocks returns every block sharing the seriesId', () => {
    const own = week[3][0]
    assert.deepEqual(
      getSeriesBlocks(week, own).map((b) => b.id).sort(),
      ['a', 'b', 'c'],
    )
  })

  test('a block with no seriesId stands alone', () => {
    const lone = block({ id: 'z', dayOfWeek: 2, seriesId: '' })
    assert.deepEqual(getSeriesBlocks(week, lone), [lone])
  })

  test('includes the block itself even if the cache does not have it yet', () => {
    const fresh = block({ id: 'new', dayOfWeek: 5 })
    assert.equal(getSeriesBlocks(week, fresh).length, 4)
  })

  test('seriesDays lists the covered days once, in order', () => {
    assert.deepEqual(seriesDays(getSeriesBlocks(week, week[1][0])), [1, 3, 6])
  })

  test('replaceDay swaps a day and collapses duplicates', () => {
    assert.deepEqual(replaceDay([1, 3, 6], 6, 5), [1, 3, 5])
    assert.deepEqual(replaceDay([1, 3, 6], 6, 3), [1, 3])
  })
})

describe('hasFieldChanges', () => {
  const stored = block({ id: 'a', dayOfWeek: 1, goalId: 'g1' })
  const form = {
    title: 'Deep Work',
    startTime: '09:00',
    endTime: '10:00',
    category: 'work',
    color: '#FFD700',
    goalId: 'g1',
    isPrivate: false,
  }

  test('false when the form matches the block', () => {
    assert.equal(hasFieldChanges(stored, form), false)
  })

  test('treats a missing goal and an empty goal as the same', () => {
    assert.equal(hasFieldChanges(block({ id: 'a', dayOfWeek: 1 }), { ...form, goalId: '' }), false)
  })

  test('true for each editable field', () => {
    assert.equal(hasFieldChanges(stored, { ...form, title: 'Other' }), true)
    assert.equal(hasFieldChanges(stored, { ...form, startTime: '09:05' }), true)
    assert.equal(hasFieldChanges(stored, { ...form, endTime: '10:30' }), true)
    assert.equal(hasFieldChanges(stored, { ...form, category: 'health' }), true)
    assert.equal(hasFieldChanges(stored, { ...form, color: '#000000' }), true)
    assert.equal(hasFieldChanges(stored, { ...form, goalId: '' }), true)
    assert.equal(hasFieldChanges(stored, { ...form, isPrivate: true }), true)
  })
})
