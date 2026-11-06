import type { Task } from '@/features/tasks/utils/types'
import { describe, expect, it } from 'vitest'

import {
  assignableMembers,
  assigneeAfterProjectChange,
  assigneeIdOf,
  belongsInMyTasks,
  canChangeTaskProject,
  canSetTaskGoal,
  filterProjectTasks,
  parseDueDate,
  projectFieldsPayload,
  projectIdOf,
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

  it('canEdit from the server wins over the role', () => {
    // A Member seeing canEdit:false gets nothing; a task with canEdit:true is
    // editable even if the role map has not loaded yet.
    expect(taskPermissions(task({ projectId: 'p', userId: 'other', canEdit: true }), { meId: 'me' })).toEqual({
      canEdit: true,
      canDelete: false,
    })
    expect(taskPermissions(task({ projectId: 'p', userId: 'me', canEdit: true }), { meId: 'me', role: 'GUEST' })).toEqual({
      canEdit: true,
      canDelete: true,
    })
    expect(taskPermissions(task({ canEdit: false }), { meId: 'me' })).toEqual({ canEdit: false, canDelete: false })
  })

  it('a non-creator task with goal and scheduleBlock null is still handled', () => {
    const t = task({ projectId: 'p', userId: 'other', goal: null, goalId: null, scheduleBlock: null, scheduleBlockId: null })
    expect(taskPermissions(t, { meId: 'me', role: 'MEMBER' })).toEqual({ canEdit: true, canDelete: false })
    expect(canSetTaskGoal(t, 'me')).toBe(false)
  })

  it('respects the server canEdit flag', () => {
    expect(taskPermissions(task({ projectId: 'p', canEdit: false, userId: 'me' }), { meId: 'me', role: 'MEMBER' })).toEqual({
      canEdit: false,
      canDelete: false,
    })
  })
})

describe('review follow-ups', () => {
  it('reads the project from the nested ref when projectId is missing', () => {
    const t = task({ project: { id: 'p', name: 'P', color: '#000' }, userId: 'other' })
    expect(projectIdOf(t)).toBe('p')
    expect(canChangeTaskProject(t, 'me')).toBe(false)
    expect(taskPermissions(t, { meId: 'me', role: 'GUEST' })).toEqual({ canEdit: false, canDelete: false })
  })

  it('an explicit null assigneeId beats a stale nested assignee', () => {
    expect(assigneeIdOf({ assigneeId: null, assignee: { id: 'u1', name: 'U' } })).toBeNull()
    expect(assigneeIdOf({ assignee: { id: 'u1', name: 'U' } })).toBe('u1')
  })

  it('withholds actions when neither canEdit nor the role is known', () => {
    expect(taskPermissions(task({ projectId: 'p', userId: 'me' }), { meId: 'me' })).toEqual({
      canEdit: false,
      canDelete: false,
    })
  })

  it('drops a newly picked assignee who has become a guest, keeps an unchanged one', () => {
    const members = [member('g', 'GUEST'), member('m')]
    expect(sanitizeAssignee('g', 'p1', members)).toBe('')
    expect(sanitizeAssignee('g', 'p1', members, 'u-other')).toBe('')
    expect(sanitizeAssignee('g', 'p1', members, 'g')).toBe('g')
    expect(sanitizeAssignee('m', 'p1', members)).toBe('m')
  })

  it('reads date-only due dates as local calendar days', () => {
    expect(parseDueDate('2026-11-09').getTime()).toBe(new Date(2026, 10, 9).getTime())
    expect(parseDueDate('2026-11-09T10:00:00.000Z').toISOString()).toBe('2026-11-09T10:00:00.000Z')
  })

  it('Due this week counts a date-only Monday and excludes next Monday', () => {
    const now = new Date(2026, 10, 6, 12) // Friday, local
    const list = [
      task({ id: 'mon', projectId: 'p', dueDate: '2026-11-02' }),
      task({ id: 'sun', projectId: 'p', dueDate: '2026-11-08' }),
      task({ id: 'next', projectId: 'p', dueDate: '2026-11-09' }),
    ]
    expect(filterProjectTasks(list, { assignee: 'all', dueThisWeek: true, now }).map((t) => t.id)).toEqual([
      'mon',
      'sun',
    ])
  })

  it('My tasks membership matches the server rule', () => {
    expect(belongsInMyTasks(task(), 'personal', 'me')).toBe(true)
    expect(belongsInMyTasks(task({ projectId: 'p', assigneeId: 'me' }), 'personal', 'me')).toBe(false)
    expect(belongsInMyTasks(task({ projectId: 'p', assigneeId: 'me' }), undefined, 'me')).toBe(true)
    expect(belongsInMyTasks(task({ projectId: 'p', assigneeId: 'u2' }), 'mine', 'me')).toBe(false)
    expect(belongsInMyTasks(task({ projectId: 'p', userId: 'me' }), 'mine', 'me')).toBe(true)
    // Someone else's unassigned project task is not mine.
    expect(belongsInMyTasks(task({ projectId: 'p', userId: 'u2' }), 'mine', 'me')).toBe(false)
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
