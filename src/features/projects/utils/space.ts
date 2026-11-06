import type { TaskListParams } from '@/lib/task-list-params'

/**
 * Which tasks space the Tasks page shows. It lives in the URL
 * (`/dashboard/tasks?project=<id>`) so links and refresh land in the same
 * place; no param means My tasks.
 */
export const PROJECT_PARAM = 'project'

export type TasksSpace = { kind: 'mine' } | { kind: 'project'; projectId: string }

/** "Mine + assigned" or "Personal only" in My tasks. */
export type TasksScope = 'mine' | 'personal'

interface ParamsLike {
  get(name: string): string | null
}

// Project ids are uuids. Anything that is not a plain id token is ignored
// rather than sent to the API, so a mangled link falls back to My tasks.
const PROJECT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

export function readProjectParam(params: ParamsLike | null | undefined): string | null {
  const raw = params?.get(PROJECT_PARAM)?.trim()
  if (!raw || !PROJECT_ID_PATTERN.test(raw)) return null
  return raw
}

export function spaceFromParams(params: ParamsLike | null | undefined): TasksSpace {
  const projectId = readProjectParam(params)
  return projectId ? { kind: 'project', projectId } : { kind: 'mine' }
}

/**
 * The href for switching to `projectId` (or back to My tasks with null),
 * keeping every other query param except the one-shot `taskId` deep link.
 */
export function buildSpaceHref(
  pathname: string,
  params: { toString(): string } | null | undefined,
  projectId: string | null,
): string {
  const next = new URLSearchParams(params ? params.toString() : '')
  next.delete('taskId')
  if (projectId) next.set(PROJECT_PARAM, projectId)
  else next.delete(PROJECT_PARAM)
  const query = next.toString()
  return query ? `${pathname}?${query}` : pathname
}

/**
 * GET /tasks params for a space. My tasks with "Mine + assigned" sends no
 * scope at all: scope=mine is the server default when there is no projectId,
 * so the request (and its cache key) is byte-for-byte what it was before
 * projects existed.
 */
export function taskListParamsFor(
  space: TasksSpace,
  scope: TasksScope,
): Pick<TaskListParams, 'scope' | 'projectId'> {
  if (space.kind === 'project') return { projectId: space.projectId }
  if (scope === 'personal') return { scope: 'personal' }
  return {}
}

export function isTasksScope(value: unknown): value is TasksScope {
  return value === 'mine' || value === 'personal'
}
