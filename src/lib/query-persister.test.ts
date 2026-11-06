import type { Query } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import { shouldDehydrateQuery } from './query-persister'

const query = (queryKey: unknown[], status: 'success' | 'error' = 'success') =>
  ({ queryKey, state: { status } }) as unknown as Query

describe('what the offline cache persists', () => {
  it('persists my own lists: tasks and the project list', () => {
    expect(shouldDehydrateQuery(query(['tasks', 'list', {}]))).toBe(true)
    expect(shouldDehydrateQuery(query(['projects']))).toBe(true)
  })

  it('never persists other people project data: members, invites, invite previews', () => {
    expect(shouldDehydrateQuery(query(['projects', 'p1', 'members']))).toBe(false)
    expect(shouldDehydrateQuery(query(['projects', 'p1', 'invites']))).toBe(false)
    expect(shouldDehydrateQuery(query(['project-invite', 'token']))).toBe(false)
  })

  it('still skips failed queries and coach transcripts', () => {
    expect(shouldDehydrateQuery(query(['tasks', 'list', {}], 'error'))).toBe(false)
    expect(shouldDehydrateQuery(query(['coach', 'chat']))).toBe(false)
  })
})
