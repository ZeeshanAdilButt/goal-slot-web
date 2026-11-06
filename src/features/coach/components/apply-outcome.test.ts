import { describe, expect, it } from 'vitest'
import { describeApplyOutcome, mapResultsToCardRows } from './apply-outcome'

describe('describeApplyOutcome', () => {
  it('says Done only when everything landed', () => {
    expect(
      describeApplyOutcome([
        { index: 0, type: 'DELETE_SCHEDULE_BLOCK', ok: true },
        { index: 1, type: 'CREATE_SCHEDULE_BLOCK', ok: true },
      ]),
    ).toBe('Done. All 2 changes were applied.')
  })

  it('reports the original failure honestly: delete applied, both creates failed', () => {
    expect(
      describeApplyOutcome([
        { index: 0, type: 'DELETE_SCHEDULE_BLOCK', ok: true },
        { index: 1, type: 'CREATE_SCHEDULE_BLOCK', ok: false, error: 'conflict' },
        { index: 2, type: 'CREATE_SCHEDULE_BLOCK', ok: false, error: 'conflict' },
      ]),
    ).toBe('Applied 1 of 3. 2 failed, see the red rows above. Ask the Coach to fix them.')
  })

  it('says nothing was applied when every action failed', () => {
    expect(
      describeApplyOutcome([{ index: 0, type: 'CREATE_SCHEDULE_BLOCK', ok: false, error: 'x' }]),
    ).toMatch(/^Nothing was applied/)
  })

  it('flags a success that only partly went as proposed', () => {
    expect(
      describeApplyOutcome([
        { index: 0, type: 'CREATE_SCHEDULE_BLOCK', ok: true, warning: 'Added on 4 of 5 days.' },
      ]),
    ).toMatch(/did not go fully as proposed/)
  })
})

describe('mapResultsToCardRows', () => {
  it('maps results for the ticked rows back onto the card rows', () => {
    const mapped = mapResultsToCardRows(
      [
        { index: 0, type: 'DELETE_SCHEDULE_BLOCK', ok: true },
        { index: 1, type: 'CREATE_SCHEDULE_BLOCK', ok: false },
      ],
      3,
      new Set([0, 2]),
    )
    expect(mapped.map((r) => r.index)).toEqual([0, 2])
  })
})
