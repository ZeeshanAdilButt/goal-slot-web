import type { CoachProposalResult } from '@/lib/api'

/**
 * The API numbers results by position in what was SENT, which is only the
 * rows the user left ticked. Map them back onto the card's own rows, or a
 * result lands on the wrong line whenever something was unticked.
 */
export function mapResultsToCardRows(
  results: CoachProposalResult[],
  rowCount: number,
  selected: ReadonlySet<number>,
): CoachProposalResult[] {
  const sent = Array.from({ length: rowCount }, (_, i) => i).filter((i) => selected.has(i))
  return results.map((r) => ({ ...r, index: sent[r.index] ?? r.index }))
}

/**
 * The footer line once an apply has landed. It used to read "Done. Refresh
 * Goals / Schedule" whatever happened, including after every create in the
 * batch had failed.
 */
export function describeApplyOutcome(
  results: CoachProposalResult[],
  /**
   * The card's rows, as lists of action indexes. When given, counts are in
   * rows, matching what the card shows: seven per-day renames in one row are
   * "one change", not seven.
   */
  rows?: number[][],
): string {
  const units: CoachProposalResult[][] = rows
    ? rows
        .map((indices) => results.filter((r) => indices.includes(r.index)))
        .filter((unit) => unit.length > 0)
    : results.map((r) => [r])
  const ok = units.filter((u) => u.every((r) => r.ok)).length
  const failed = units.length - ok
  const caveats = units.filter(
    (u) => u.every((r) => r.ok) && u.some((r) => r.warning && !r.alreadyDone),
  ).length
  const total = units.length
  if (failed === 0 && caveats === 0) {
    return `Done. ${ok === 1 ? 'The change was' : `All ${ok} changes were`} applied.`
  }
  if (failed === 0) {
    return `Applied, but ${caveats === 1 ? 'one change' : `${caveats} changes`} did not go fully as proposed. See the notes above.`
  }
  if (ok === 0) {
    return 'Nothing was applied. The reasons are on each row above. Ask the Coach to fix them.'
  }
  return `Applied ${ok} of ${total}. ${failed} failed, see the red rows above. Ask the Coach to fix them.`
}
