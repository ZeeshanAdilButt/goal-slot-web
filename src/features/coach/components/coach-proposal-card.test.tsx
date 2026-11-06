import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { CoachProposalCard } from './coach-proposal-card'

// Server-rendered output of the real card, with the schedule cache seeded the
// way the card's own eager query fills it. Proves the grouping reaches the
// markup, not just the helper.
function render(actions: any[]) {
  const qc = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } })
  const week: Record<number, any[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
  for (const d of [0, 1, 2, 3, 4, 5, 6]) {
    week[d].push({ id: `ct${d}`, title: 'Community Time', dayOfWeek: d, startTime: '16:00', endTime: '17:00' })
  }
  week[2].push({ id: 'r2', title: 'Reading & Labs (Core Engineering)', dayOfWeek: 2, startTime: '07:00', endTime: '09:00' })
  week[4].push({ id: 'r4', title: 'Reading & Labs (Core Engineering)', dayOfWeek: 4, startTime: '07:00', endTime: '09:00' })
  qc.setQueryData(['schedule', 'weekly'], week)
  qc.setQueryData(['goals', 'list', undefined], [])
  qc.setQueryData(['time-tracker', 'coach-lookup'], [])
  return renderToStaticMarkup(
    <QueryClientProvider client={qc}>
      <CoachProposalCard block={{ summary: 'Restructure', actions }} sourceMessageId="m1" />
    </QueryClientProvider>,
  )
}

describe('CoachProposalCard grouped rows', () => {
  const actions = [
    { type: 'UPDATE_SCHEDULE_BLOCK', id: 'r2', payload: { title: 'Core Engineering', startTime: '07:00', endTime: '08:00' } },
    { type: 'UPDATE_SCHEDULE_BLOCK', id: 'r4', payload: { title: 'Core Engineering', startTime: '07:00', endTime: '08:00' } },
    { type: 'CREATE_SCHEDULE_BLOCK', payload: { title: 'Soft Skills Lab', startTime: '08:00', endTime: '08:30', daysOfWeek: [2, 4], category: 'LEARNING' } },
    { type: 'CREATE_SCHEDULE_BLOCK', payload: { title: 'Tech Lab', startTime: '08:30', endTime: '09:00', daysOfWeek: [2, 4], category: 'LEARNING' } },
    ...[0, 1, 2, 3, 4, 5, 6].map((d) => ({
      type: 'UPDATE_SCHEDULE_BLOCK',
      id: `ct${d}`,
      expectedTitle: 'Community Time',
      payload: { title: 'Dev Weekends' },
    })),
  ]

  it('shows 11 actions as two rows, one per change', () => {
    const html = render(actions)
    expect(html.match(/<li /g)?.length).toBe(2)
    expect(html).toContain('Tue, Thu: &quot;Reading &amp; Labs (Core Engineering)&quot; 7:00 AM to 9:00 AM becomes Core Engineering 7:00 AM to 8:00 AM, Soft Skills Lab 8:00 AM to 8:30 AM, Tech Lab 8:30 AM to 9:00 AM')
    expect(html).toContain('Every day: &quot;Community Time&quot; 4:00 PM to 5:00 PM, renamed to &quot;Dev Weekends&quot;')
    // The Apply count is in changes the user can see, not raw actions.
    expect(html).toMatch(/Apply <!-- -->\(2\)|Apply \(2\)/)
  })
})
