import assert from 'node:assert/strict'

import { test } from 'vitest'

import { TIME_OPTIONS, timeOptionsIncluding } from './utils.ts'

test('returns the plain grid when every value is already on it', () => {
  assert.equal(timeOptionsIncluding('09:00', '10:30'), TIME_OPTIONS)
  assert.equal(timeOptionsIncluding(), TIME_OPTIONS)
  assert.equal(timeOptionsIncluding(null, undefined), TIME_OPTIONS)
})

test('folds in an off-grid time so the Select has an item to show', () => {
  // Without this the Select renders its placeholder and the user cannot see
  // or re-pick the time the block is actually set to.
  const opts = timeOptionsIncluding('04:20')
  const match = opts.find((o) => o.value === '04:20')
  assert.ok(match)
  assert.equal(match.label, '4:20 AM')
  assert.equal(opts.length, TIME_OPTIONS.length + 1)
})

test('inserts chronologically rather than appending', () => {
  const opts = timeOptionsIncluding('13:05')
  const i = opts.findIndex((o) => o.value === '13:05')
  assert.equal(opts[i - 1]?.value, '13:00')
  assert.equal(opts[i + 1]?.value, '13:15')
})

test('covers the real production times that triggered this', () => {
  // Straight from the ScheduleBlock table: a university timetable, Fajr, and
  // a block running to the last minute of the day.
  for (const value of ['04:20', '04:50', '23:59', '09:25', '10:20', '13:05', '14:25', '15:10']) {
    const opts = timeOptionsIncluding(value)
    assert.ok(
      opts.some((o) => o.value === value),
      `${value} missing`,
    )
  }
})

test('labels midnight and noon the way the grid does', () => {
  assert.equal(timeOptionsIncluding('00:07').find((o) => o.value === '00:07')?.label, '12:07 AM')
  assert.equal(timeOptionsIncluding('12:07').find((o) => o.value === '12:07')?.label, '12:07 PM')
})

test('handles both fields being off-grid at once, without duplicates', () => {
  const opts = timeOptionsIncluding('08:32', '08:32', '17:41')
  assert.equal(opts.filter((o) => o.value === '08:32').length, 1)
  assert.equal(opts.length, TIME_OPTIONS.length + 2)
})

test('ignores values that are not HH:MM', () => {
  assert.equal(timeOptionsIncluding('', 'nonsense', '9:00', '09:00:00'), TIME_OPTIONS)
})
