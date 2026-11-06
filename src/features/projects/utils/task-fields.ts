import type { Task } from '@/features/tasks/utils/types'
import { endOfWeek, isWithinInterval, startOfWeek } from 'date-fns'

import type { ProjectMember, ProjectRole, ProjectSummary } from './types'

/** Projects a task can be created in or moved to: anything but Guest. */
export function writableProjects(projects: ProjectSummary[]): ProjectSummary[] {
  return projects.filter((p) => p.role === 'ADMIN' || p.role === 'MEMBER')
}

function isCreator(task: Task, meId: string | null | undefined): boolean {
  // A personal task is only ever listed to its creator. A project task can be
  // anyone's, so it needs the userId to say it is ours.
  if (!task.projectId) return true
  return !!meId && task.userId === meId
}

/** Only the creator may move a task between My tasks and a project. */
export function canChangeTaskProject(task: Task | null | undefined, meId: string | null | undefined): boolean {
  if (!task) return true
  return isCreator(task, meId)
}

/**
 * Goals stay personal: a project task's goal can only be set by its creator,
 * to one of the creator's own goals. Everyone else sees no goal field.
 */
export function canSetTaskGoal(task: Task | null | undefined, meId: string | null | undefined): boolean {
  if (!task) return true
  return isCreator(task, meId)
}

/**
 * Switching project resets the assignee: members differ per project and a
 * personal task has no assignee at all.
 */
export function assigneeAfterProjectChange(
  previousProjectId: string,
  nextProjectId: string,
  assigneeId: string,
): string {
  if (!nextProjectId) return ''
  return previousProjectId === nextProjectId ? assigneeId : ''
}

/** Drops an assignee that cannot apply: no project, or not a member of it. */
export function sanitizeAssignee(
  assigneeId: string,
  projectId: string,
  members: ProjectMember[] | undefined,
): string {
  if (!projectId || !assigneeId) return ''
  if (!members) return assigneeId
  return members.some((m) => m.userId === assigneeId) ? assigneeId : ''
}

/** Members who can be assigned: Guests cannot edit, so they are not offered. */
export function assignableMembers(members: ProjectMember[]): ProjectMember[] {
  return members.filter((m) => m.role !== 'GUEST')
}

/**
 * The projectId / assigneeId part of a POST or PUT /tasks body.
 *
 * Create: only what is set (an assignee without a project is a 400).
 * Edit: only what changed. null means "move to My tasks" or "unassign".
 * Moving a task to My tasks never sends an assignee: the server clears it.
 */
export function projectFieldsPayload(
  task: Task | null | undefined,
  projectId: string,
  assigneeId: string,
): { projectId?: string | null; assigneeId?: string | null } {
  const nextProject = projectId || null
  const nextAssignee = nextProject ? assigneeId || null : null

  if (!task) {
    if (!nextProject) return {}
    return nextAssignee ? { projectId: nextProject, assigneeId: nextAssignee } : { projectId: nextProject }
  }

  const out: { projectId?: string | null; assigneeId?: string | null } = {}
  const originalProject = task.projectId ?? null
  const originalAssignee = task.assigneeId ?? task.assignee?.id ?? null

  if (originalProject !== nextProject) out.projectId = nextProject
  if (nextProject && originalAssignee !== nextAssignee) out.assigneeId = nextAssignee
  return out
}

export interface TaskPermissions {
  canEdit: boolean
  canDelete: boolean
}

const FULL_ACCESS: TaskPermissions = { canEdit: true, canDelete: true }

/**
 * What the board offers for one task. The server's canEdit decides editing;
 * the role only fills in when an older response has no canEdit, and decides
 * delete (Admins any task, Members only their own). The server stays the
 * authority either way.
 */
export function taskPermissions(
  task: Task,
  ctx: { meId?: string | null; role?: ProjectRole | null },
): TaskPermissions {
  if (task.canEdit === false) return { canEdit: false, canDelete: false }
  if (!task.projectId) return FULL_ACCESS
  if (task.canEdit === undefined && ctx.role === 'GUEST') return { canEdit: false, canDelete: false }
  const canEdit = task.canEdit ?? true
  const ownsTask = !!ctx.meId && task.userId === ctx.meId
  return {
    canEdit,
    canDelete: ctx.role === 'ADMIN' || (canEdit && ownsTask),
  }
}

/** Project board assignee filter: chips and the members sidebar share it. */
export type AssigneeFilter = 'all' | 'me' | 'unassigned' | `user:${string}`

export function assigneeIdOf(task: Task): string | null {
  return task.assigneeId ?? task.assignee?.id ?? null
}

export function filterProjectTasks(
  tasks: Task[],
  opts: { assignee: AssigneeFilter; dueThisWeek: boolean; meId?: string | null; now?: Date },
): Task[] {
  const now = opts.now ?? new Date()
  const week = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
  return tasks.filter((task) => {
    const assignee = assigneeIdOf(task)
    if (opts.assignee === 'me' && (!opts.meId || assignee !== opts.meId)) return false
    if (opts.assignee === 'unassigned' && assignee) return false
    if (opts.assignee.startsWith('user:') && assignee !== opts.assignee.slice(5)) return false
    if (opts.dueThisWeek) {
      if (!task.dueDate) return false
      if (!isWithinInterval(new Date(task.dueDate), week)) return false
    }
    return true
  })
}
