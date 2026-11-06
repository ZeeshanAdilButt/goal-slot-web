import type { Task } from '@/features/tasks/utils/types'
import { describe, expect, it } from 'vitest'

import {
  assignableMembers,
  assigneeAfterProjectChange,
  canChangeTaskProject,
  canSetTaskGoal,
  filterProjectTasks,
  projectFieldsPayload,
  sanitizeAssignee,
  taskPermissions,
  writableProjects,
} from './task-fields'
import type { ProjectMember, ProjectSummary } from './types'

const task = (over: Partial<Task> = {}): Task => ({ id: 't1', title: 'T', status: 'TODO', ...over })
const member = (userId: string, role: ProjectMember['role'] = 'MEMBER'): ProjectMember => ({
  userId,
  name: userId,
  role,
  joinedAt: '2026-11-01T00:00:00Z',
})
const project = (id: string, role: ProjectSummary['role']): ProjectSummary => ({
  id,
  name: id,
  color: '#2563EB',
  role,
  memberCount: 2,
  openTaskCount: 1,
})

describe('project field rules', () => {
  it('only offers projects the user can write to', () => {
    const list = [project('a', 'ADMIN'), project('m', 'MEMBER'), project('g', 'GUEST')]
    expect(writableProjects(list).map((p) => p.id)).toEqual(['a', 'm'])
  })

  it('lets the creator move a task between My tasks and a project, nobody else', () => {
    expect(canChangeTaskProject(null, 'me')).toBe(true)
    expect(canChangeTaskProject(task(), 'me')).toBe(true)
    expect(canChangeTaskProject(task({ projectId: 'p', userId: 'me' }), 'me')).toBe(true)
    expect(canChangeTaskProject(task({ projectId: 'p', userId: 'other' }), 'me')).toBe(false)
    expect(canChangeTaskProject(task({ projectId: 'p' }), 'me')).toBe(false)
  })

  it('only the creator sets a goal on a project task', () => {
    expect(canSetTaskGoal(null, 'me')).toBe(true)
    expect(canSetTaskGoal(task({ projectId: 'p', userId: 'me' }), 'me')).toBe(true)
    expect(canSetTaskGoal(task({ projectId: 'p', userId: 'other' }), 'me')).toBe(false)
  })
})

describe('assignee field rules', () => {
  it('clears the assignee when the project changes or becomes My tasks', () => {
    expect(assigneeAfterProjectChange('p1', 'p1', 'u1')).toBe('u1')
    expect(assigneeAfterProjectChange('p1', 'p2', 'u1')).toBe('')
    expect(assigneeAfterProjectChange('p1', '', 'u1')).toBe('')
  })

  it('drops an assignee with no project or who is not a member', () => {
    expect(sanitizeAssignee('u1', '', [member('u1')])).toBe('')
    expect(sanitizeAssignee('u1', 'p1', [member('u2')])).toBe('')
    expect(sanitizeAssignee('u1', 'p1', [member('u1')])).toBe('u1')
    // Members still loading: keep the choice rather than flicker it away.
    expect(sanitizeAssignee('u1', 'p1', undefined)).toBe('u1')
  })

  it('does not offer guests as assignees', () => {
    expect(assignableMembers([member('a', 'ADMIN'), member('m'), member('g', 'GUEST')]).map((m) => m.userId)).toEqual([
      'a',
      'm',
    ])
  })
})

describe('task payload for project and assignee', () => {
  it('create in My tasks sends neither field', () => {
    expect(projectFieldsPayload(null, '', '')).toEqual({})
  })

  it('create never sends an assignee without a project', () => {
    expect(projectFieldsPayload(null, '', 'u1')).toEqual({})
  })

  it('create in a project sends projectId and the assignee when set', () => {
    expect(projectFieldsPayload(null, 'p1', '')).toEqual({ projectId: 'p1' })
    expect(projectFieldsPayload(null, 'p1', 'u1')).toEqual({ projectId: 'p1', assigneeId: 'u1' })
  })

  it('edit with nothing changed sends nothing', () => {
    expect(projectFieldsPayload(task({ projectId: 'p1', assigneeId: 'u1' }), 'p1', 'u1')).toEqual({})
    expect(projectFieldsPayload(task(), '', '')).toEqual({})
  })

  it('edit sends null to unassign', () => {
    expect(projectFieldsPayload(task({ projectId: 'p1', assigneeId: 'u1' }), 'p1', '')).toEqual({ assigneeId: null })
  })

  it('edit reads the assignee from the nested object when assigneeId is absent', () => {
    expect(projectFieldsPayload(task({ projectId: 'p1', assignee: { id: 'u1', name: 'U' } }), 'p1', 'u1')).toEqual({})
  })

  it('moving a personal task into a project sends projectId (and assignee if picked)', () => {
    expect(projectFieldsPayload(task(), 'p1', '')).toEqual({ projectId: 'p1' })
    expect(projectFieldsPayload(task(), 'p1', 'u1')).toEqual({ projectId: 'p1', assigneeId: 'u1' })
  })

  it('moving back to My tasks sends projectId null and leaves clearing the assignee to the server', () => {
    expect(projectFieldsPayload(task({ projectId: 'p1', assigneeId: 'u1' }), '', '')).toEqual({ projectId: null })
  })
})

describe('task permissions on the board', () => {
  it('personal tasks are fully editable', () => {
    expect(taskPermissions(task(), { meId: 'me' })).toEqual({ canEdit: true, canDelete: true })
  })

  it('guests are read-only', () => {
    expect(taskPermissions(task({ projectId: 'p', userId: 'me' }), { meId: 'me', role: 'GUEST' })).toEqual({
      canEdit: false,
      canDelete: false,
    })
  })

  it('members delete only tasks they created; admins delete any', () => {
    const others = task({ projectId: 'p', userId: 'other' })
    const mine = task({ projectId: 'p', userId: 'me' })
    expect(taskPermissions(others, { meId: 'me', role: 'MEMBER' })).toEqual({ canEdit: true, canDelete: false })
    expect(taskPermissions(mine, { meId: 'me', role: 'MEMBER' })).toEqual({ canEdit: true, canDelete: true })
    expect(taskPermissions(others, { meId: 'me', role: 'ADMIN' })).toEqual({ canEdit: true, canDelete: true })
  })

  it('respects the server canEdit flag', () => {
    expect(taskPermissions(task({ projectId: 'p', canEdit: false, userId: 'me' }), { meId: 'me', role: 'MEMBER' })).toEqual({
      canEdit: false,
      canDelete: false,
    })
  })
})

describe('project board filters', () => {
  const now = new Date('2026-11-06T12:00:00') // a Friday
  const tasks = [
    task({ id: 'mine', projectId: 'p', assigneeId: 'me', dueDate: '2026-11-07' }),
    task({ id: 'theirs', projectId: 'p', assignee: { id: 'u2', name: 'U2' }, dueDate: '2026-11-20' }),
    task({ id: 'none', projectId: 'p' }),
  ]
  const ids = (list: Task[]) => list.map((t) => t.id)

  it('Everyone shows all', () => {
    expect(ids(filterProjectTasks(tasks, { assignee: 'all', dueThisWeek: false, meId: 'me', now }))).toEqual([
      'mine',
      'theirs',
      'none',
    ])
  })

  it('Assigned to me, Unassigned, and a specific member', () => {
    expect(ids(filterProjectTasks(tasks, { assignee: 'me', dueThisWeek: false, meId: 'me', now }))).toEqual(['mine'])
    expect(ids(filterProjectTasks(tasks, { assignee: 'unassigned', dueThisWeek: false, meId: 'me', now }))).toEqual([
      'none',
    ])
    expect(ids(filterProjectTasks(tasks, { assignee: 'user:u2', dueThisWeek: false, meId: 'me', now }))).toEqual([
      'theirs',
    ])
  })

  it('Due this week keeps tasks due Monday to Sunday of this week', () => {
    expect(ids(filterProjectTasks(tasks, { assignee: 'all', dueThisWeek: true, meId: 'me', now }))).toEqual(['mine'])
  })
})
