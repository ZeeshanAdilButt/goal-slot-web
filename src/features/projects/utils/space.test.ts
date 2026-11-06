import { sanitizeTaskListParams } from '@/lib/task-list-params'
import { describe, expect, it } from 'vitest'

import { buildSpaceHref, readProjectParam, spaceFromParams, taskListParamsFor } from './space'

const params = (query: string) => new URLSearchParams(query)

describe('switcher URL state', () => {
  it('no project param is My tasks', () => {
    expect(spaceFromParams(params(''))).toEqual({ kind: 'mine' })
    expect(spaceFromParams(null)).toEqual({ kind: 'mine' })
  })

  it('reads ?project=<id> as project mode', () => {
    expect(spaceFromParams(params('project=6f1c2a9e-1b2c-4d5e-8f90-123456789abc'))).toEqual({
      kind: 'project',
      projectId: '6f1c2a9e-1b2c-4d5e-8f90-123456789abc',
    })
  })

  it('ignores an empty or malformed project param', () => {
    expect(readProjectParam(params('project='))).toBeNull()
    expect(readProjectParam(params('project=%20%20'))).toBeNull()
    expect(readProjectParam(params('project=../../admin'))).toBeNull()
    expect(readProjectParam(params(`project=${'a'.repeat(65)}`))).toBeNull()
  })

  it('switching to a project sets the param and keeps other params', () => {
    expect(buildSpaceHref('/dashboard/tasks', params('view=list'), 'p1')).toBe('/dashboard/tasks?view=list&project=p1')
  })

  it('switching between projects replaces the param', () => {
    expect(buildSpaceHref('/dashboard/tasks', params('project=p1'), 'p2')).toBe('/dashboard/tasks?project=p2')
  })

  it('switching back to My tasks removes the param', () => {
    expect(buildSpaceHref('/dashboard/tasks', params('project=p1'), null)).toBe('/dashboard/tasks')
  })

  it('drops the one-shot taskId deep link when switching', () => {
    expect(buildSpaceHref('/dashboard/tasks', params('taskId=t1&project=p1'), null)).toBe('/dashboard/tasks')
  })
})

describe('scope mapping', () => {
  it('My tasks, Mine + assigned sends no scope (server default scope=mine, request unchanged)', () => {
    expect(taskListParamsFor({ kind: 'mine' }, 'mine')).toEqual({})
  })

  it('My tasks, Personal only maps to scope=personal', () => {
    expect(taskListParamsFor({ kind: 'mine' }, 'personal')).toEqual({ scope: 'personal' })
  })

  it('never sends assignee (filtered client side; the API 400s it outside project mode)', () => {
    for (const p of [
      taskListParamsFor({ kind: 'mine' }, 'mine'),
      taskListParamsFor({ kind: 'mine' }, 'personal'),
      taskListParamsFor({ kind: 'project', projectId: 'p1' }, 'mine'),
    ]) {
      expect(p).not.toHaveProperty('assignee')
    }
  })

  it('the API client drops assignee when there is no projectId', () => {
    expect(sanitizeTaskListParams({ assignee: 'me' })).toEqual({})
    expect(sanitizeTaskListParams({ scope: 'personal', assignee: 'unassigned' })).toEqual({ scope: 'personal' })
    expect(sanitizeTaskListParams({ projectId: 'p1', assignee: 'me' })).toEqual({ projectId: 'p1', assignee: 'me' })
    expect(sanitizeTaskListParams(undefined)).toBeUndefined()
  })

  it('project mode sends projectId and ignores the My tasks scope toggle', () => {
    expect(taskListParamsFor({ kind: 'project', projectId: 'p1' }, 'personal')).toEqual({ projectId: 'p1' })
    expect(taskListParamsFor({ kind: 'project', projectId: 'p1' }, 'mine')).toEqual({ projectId: 'p1' })
  })
})
