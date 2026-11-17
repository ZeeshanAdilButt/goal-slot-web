import assert from 'node:assert/strict'

import { describe, test } from 'vitest'

import {
  addMinutesToTime,
  durationMinutes,
  formatDuration,
  hhmmToMinutes,
  isEndAfterStart,
  parseTimeInput,
  shiftEndWithStart,
} from './time-input.ts'

describe('parseTimeInput', () => {
  test('reads every documented format', () => {
    assert.equal(parseTimeInput('7'), '07:00')
    assert.equal(parseTimeInput('7a'), '07:00')
    assert.equal(parseTimeInput('7:30'), '07:30')
    assert.equal(parseTimeInput('7:30pm'), '19:30')
    assert.equal(parseTimeInput('1930'), '19:30')
    assert.equal(parseTimeInput('19:30'), '19:30')
  })

  test('reads other common ways of typing a time', () => {
    assert.equal(parseTimeInput('7p'), '19:00')
    assert.equal(parseTimeInput('7am'), '07:00')
    assert.equal(parseTimeInput('7 PM'), '19:00')
    assert.equal(parseTimeInput('  7:30 pm  '), '19:30')
    assert.equal(parseTimeInput('730'), '07:30')
    assert.equal(parseTimeInput('0730'), '07:30')
    assert.equal(parseTimeInput('7.30'), '07:30')
    assert.equal(parseTimeInput('9:25'), '09:25')
    assert.equal(parseTimeInput('04:20'), '04:20')
    assert.equal(parseTimeInput('23:59'), '23:59')
    assert.equal(parseTimeInput('0'), '00:00')
  })

  test('handles midnight and noon in 12-hour form', () => {
    assert.equal(parseTimeInput('12am'), '00:00')
    assert.equal(parseTimeInput('12:30am'), '00:30')
    assert.equal(parseTimeInput('12pm'), '12:00')
    assert.equal(parseTimeInput('12:15 pm'), '12:15')
    assert.equal(parseTimeInput('1p'), '13:00')
  })

  test('rejects anything that is not a time of day', () => {
    for (const bad of ['', '   ', 'abc', '25', '24:00', '2400', '7:60', '7:5', '13pm', '0am', '99:99', '7:30:00', '-7', '7pmm', '12345']) {
      assert.equal(parseTimeInput(bad), null, `expected "${bad}" to be rejected`)
    }
  })
})

describe('duration math', () => {
  test('durationMinutes and formatDuration', () => {
    assert.equal(durationMinutes('07:00', '08:30'), 90)
    assert.equal(durationMinutes('04:20', '09:25'), 305)
    assert.equal(durationMinutes('10:00', '09:00'), -60)
    assert.equal(durationMinutes('nope', '09:00'), null)
    assert.equal(formatDuration(90), '1h 30m')
    assert.equal(formatDuration(45), '45m')
    assert.equal(formatDuration(120), '2h')
    assert.equal(formatDuration(305), '5h 5m')
    assert.equal(formatDuration(0), '0m')
    assert.equal(formatDuration(-30), '0m')
  })

  test('isEndAfterStart rejects equal, reversed and unreadable ranges', () => {
    assert.equal(isEndAfterStart('09:00', '09:15'), true)
    assert.equal(isEndAfterStart('09:00', '09:00'), false)
    assert.equal(isEndAfterStart('10:00', '09:00'), false)
    assert.equal(isEndAfterStart('09:00', ''), false)
  })

  test('addMinutesToTime sets the end from the start and refuses to cross midnight', () => {
    assert.equal(addMinutesToTime('07:00', 90), '08:30')
    assert.equal(addMinutesToTime('09:25', 15), '09:40')
    assert.equal(addMinutesToTime('22:00', 120), null)
    assert.equal(addMinutesToTime('22:59', 60), '23:59')
    assert.equal(addMinutesToTime('23:00', 60), null)
  })

  test('shiftEndWithStart keeps the duration, including off-grid times', () => {
    assert.equal(shiftEndWithStart('09:00', '10:30', '13:00'), '14:30')
    assert.equal(shiftEndWithStart('09:25', '10:10', '04:20'), '05:05')
    assert.equal(shiftEndWithStart('09:00', '10:00', '09:00'), '10:00')
  })

  test('shiftEndWithStart pins to 23:59 rather than wrapping past midnight', () => {
    assert.equal(shiftEndWithStart('09:00', '11:00', '23:00'), '23:59')
  })

  test('shiftEndWithStart falls back to one hour when the old range was invalid', () => {
    assert.equal(shiftEndWithStart('10:00', '09:00', '07:00'), '08:00')
    assert.equal(shiftEndWithStart('x', '09:00', '07:00'), null)
  })

  test('hhmmToMinutes validates', () => {
    assert.equal(hhmmToMinutes('00:00'), 0)
    assert.equal(hhmmToMinutes('23:59'), 1439)
    assert.equal(hhmmToMinutes('24:00'), null)
    assert.equal(hhmmToMinutes('7:5'), null)
  })
})
