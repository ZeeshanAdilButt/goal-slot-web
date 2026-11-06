/**
 * GET /tasks list params. With no projectId the server defaults to
 * scope=mine (personal tasks, plus project tasks assigned to me or created by
 * me and unassigned). scope=personal is only my own non-project tasks.
 * projectId lists a whole project board (membership checked server side),
 * optionally narrowed by assignee.
 */
export interface TaskListParams {
  status?: string
  statuses?: string[]
  goalId?: string
  scheduleBlockId?: string
  dayOfWeek?: number
  scope?: 'mine' | 'personal'
  projectId?: string
  assignee?: 'me' | 'unassigned' | (string & {})
}

/**
 * assignee only means something on a project board; the API answers 400 when
 * it is sent without projectId, so it is dropped here rather than sent.
 */
export function sanitizeTaskListParams(params?: TaskListParams): TaskListParams | undefined {
  if (!params || params.assignee === undefined || params.projectId) return params
  const rest = { ...params }
  delete rest.assignee
  return rest
}
