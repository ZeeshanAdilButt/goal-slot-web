import type { Task } from '@/features/tasks/utils/types'
import { endOfWeek, isWithinInterval, parseISO, startOfWeek } from 'date-fns'

import type { ProjectMember, ProjectRole, ProjectSummary } from './types'

/** Projects a task can be created in or moved to: anything but Guest. */
export function writableProjects(projects: ProjectSummary[]): ProjectSummary[] {
  return projects.filter((p) => p.role === 'ADMIN' || p.role === 'MEMBER')
}

/** The task's project id, from projectId or the nested project ref. */
export function projectIdOf(task: Pick<Task, 'projectId' | 'project'>): string | null {
  return task.projectId ?? task.project?.id ?? null
}

/**
 * The task's assignee id. An explicit assigneeId (null included) wins over
 * the nested object, which can be stale after an optimistic unassign.
 */
export function assigneeIdOf(task: Pick<Task, 'assigneeId' | 'assignee'>): string | null {
  if (task.assigneeId !== undefined) return task.assigneeId
  return task.assignee?.id ?? null
}

function isCreator(task: Task, meId: string | null | undefined): boolean {
  // A personal task is only ever listed to its creator. A project task can be
  // anyone's, so it needs the userId to say it is ours.
  if (!projectIdOf(task)) return true
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

/**
 * Drops an assignee that cannot apply: no project, not a member, or a Guest
 * picked anew (members can change role while the form is open). An existing
 * assignment that is left unchanged is kept as it is.
 */
export function sanitizeAssignee(
  assigneeId: string,
  projectId: string,
  members: ProjectMember[] | undefined,
  originalAssigneeId?: string | null,
): string {
  if (!projectId || !assigneeId) return ''
  if (!members) return assigneeId
  const member = members.find((m) => m.userId === assigneeId)
  if (!member) return ''
  if (member.role === 'GUEST' && assigneeId !== originalAssigneeId) return ''
  return assigneeId
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
  const originalProject = projectIdOf(task)
  const originalAssignee = assigneeIdOf(task)

  if (originalProject !== nextProject) out.projectId = nextProject
  if (nextProject && originalAssignee !== nextAssignee) out.assigneeId = nextAssignee
  return out
}

export interface TaskPermissions {
  canEdit: boolean
  canDelete: boolean
}

const FULL_ACCESS: TaskPermissions = { canEdit: true, canDelete: true }
const NO_ACCESS: TaskPermissions = { canEdit: false, canDelete: false }

/**
 * What the board offers for one task. The server's canEdit decides editing;
 * the role fills in when canEdit is missing (an optimistic task) and decides
 * delete (Admins any task, Members only their own). With neither known, the
 * controls are withheld until the server says. The server stays the authority.
 */
export function taskPermissions(
  task: Task,
  ctx: { meId?: string | null; role?: ProjectRole | null },
): TaskPermissions {
  if (task.canEdit === false) return NO_ACCESS
  if (!projectIdOf(task)) return FULL_ACCESS
  if (task.canEdit === undefined && (!ctx.role || ctx.role === 'GUEST')) return NO_ACCESS
  const ownsTask = !!ctx.meId && task.userId === ctx.meId
  return { canEdit: true, canDelete: ctx.role === 'ADMIN' || ownsTask }
}

/** Project board assignee filter: chips and the members sidebar share it. */
export type AssigneeFilter = 'all' | 'me' | 'unassigned' | `user:${string}`

/**
 * A due date as a calendar instant. Date-only values (YYYY-MM-DD, as a fresh
 * optimistic task carries) are read in local time; `new Date()` would read
 * them as UTC midnight and shift them a day west of UTC.
 */
export function parseDueDate(value: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseISO(value) : new Date(value)
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
      if (!isWithinInterval(parseDueDate(task.dueDate), week)) return false
    }
    return true
  })
}

/**
 * Whether a task belongs in a My tasks list (scope=mine or personal), the
 * same rule the server applies: personal tasks, plus project tasks assigned
 * to me, plus project tasks I created that are unassigned. Used to keep
 * optimistic cache updates from flashing a task into the wrong list.
 */
export function belongsInMyTasks(task: Task, scope: 'mine' | 'personal' | undefined, meId?: string | null): boolean {
  if (!projectIdOf(task)) return true
  if (scope === 'personal') return false
  if (!meId) return true
  const assignee = assigneeIdOf(task)
  if (assignee) return assignee === meId
  return !task.userId || task.userId === meId
}
