import { taskQueries } from '@/features/tasks/utils/queries'
import { CreateTaskForm, Task, TaskStatus } from '@/features/tasks/utils/types'
import { capture } from '@/utils/posthog/capture'
import { Events } from '@/utils/posthog/events'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { useOfflineMutation } from '@/hooks/use-offline-mutation'
import { tasksApi } from '@/lib/api'
import '@/features/tasks/utils/offline-operations'

type TaskListFilters = { status?: TaskStatus; statuses?: TaskStatus[]; goalId?: string }

const normalizeTaskInput = (data: Partial<CreateTaskForm>) => ({
  ...data,
  goalId: data.goalId || undefined,
  scheduleBlockId: data.scheduleBlockId || undefined,
  dueDate: data.dueDate || undefined,
  estimatedMinutes: data.estimatedMinutes ? parseInt(data.estimatedMinutes) : undefined,
  notes: data.notes || undefined,
})

const getListFilters = (queryKey: readonly unknown[]): TaskListFilters | undefined => {
  return queryKey[2] as TaskListFilters | undefined
}

const matchesFilters = (task: Task, filters?: TaskListFilters) => {
  if (!filters) return true
  if (filters.statuses && filters.statuses.length > 0 && !filters.statuses.includes(task.status)) return false
  if (filters.status && task.status !== filters.status) return false
  if (filters.goalId && task.goalId !== filters.goalId) return false
  return true
}

const syncTaskInCache = (
  queryClient: QueryClient,
  task: Task,
  options: { isDeleted?: boolean; optimisticId?: string } = {},
) => {
  const activeLists = queryClient.getQueriesData<Task[]>({
    queryKey: taskQueries.all,
    type: 'active',
  })

  activeLists.forEach(([queryKey, data]) => {
    if (!Array.isArray(data) || queryKey[1] !== 'list') return

    const filters = getListFilters(queryKey)
    const shouldInclude = !options.isDeleted && matchesFilters(task, filters)

    const existingIndex = data.findIndex(
      (t) => t.id === task.id || (options.optimisticId && t.id === options.optimisticId),
    )

    let newData = [...data]

    if (!shouldInclude) {
      if (existingIndex === -1) return
      newData = newData.filter((_, i) => i !== existingIndex)
    } else {
      if (existingIndex >= 0) {
        newData[existingIndex] = task
      } else {
        newData = [task, ...newData]
      }
    }

    queryClient.setQueryData(queryKey, newData)
  })
}

const snapshotCache = (queryClient: QueryClient) => queryClient.getQueriesData({ queryKey: taskQueries.all })

const rollbackCache = (queryClient: QueryClient, previous: ReturnType<typeof snapshotCache> | undefined) => {
  previous?.forEach(([key, data]) => queryClient.setQueryData(key, data))
}

const findTaskInCache = (queryClient: QueryClient, taskId: string): Task | undefined => {
  const lists = queryClient.getQueriesData<Task[]>({ queryKey: taskQueries.all })
  for (const [, data] of lists) {
    if (!Array.isArray(data)) continue
    const found = data.find((t) => t.id === taskId)
    if (found) return found
  }
  return undefined
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient()

  return useOfflineMutation<CreateTaskForm, { previous: ReturnType<typeof snapshotCache> }>({
    kind: 'task.create',
    buildPayload: (form, meta) => ({
      id: meta.entityId,
      ...normalizeTaskInput(form),
      title: form.title,
    }),
    optimisticUpdate: (form, meta) => {
      const previous = snapshotCache(queryClient)
      const optimisticTask: Task = {
        id: meta.entityId,
        title: form.title,
        description: normalizeTaskInput(form).description,
        status: 'BACKLOG',
        category: normalizeTaskInput(form).category,
        estimatedMinutes: normalizeTaskInput(form).estimatedMinutes,
        goalId: normalizeTaskInput(form).goalId,
        scheduleBlockId: normalizeTaskInput(form).scheduleBlockId,
        dueDate: normalizeTaskInput(form).dueDate,
        notes: normalizeTaskInput(form).notes,
      } as Task
      syncTaskInCache(queryClient, optimisticTask)
      return { previous }
    },
    rollback: (ctx) => rollbackCache(queryClient, ctx?.previous),
    invalidateKeys: [taskQueries.all],
    messages: {
      offline: 'Task saved offline — will sync when you reconnect',
      success: 'Task created',
      error: 'Failed to create task',
    },
  })
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient()

  return useOfflineMutation<
    { taskId: string; data: Partial<CreateTaskForm & { status?: TaskStatus }> },
    { previous: ReturnType<typeof snapshotCache> }
  >({
    kind: 'task.update',
    buildPayload: ({ taskId, data }) => ({
      id: taskId,
      data: normalizeTaskInput(data),
    }),
    optimisticUpdate: ({ taskId, data }) => {
      const previous = snapshotCache(queryClient)
      const original = findTaskInCache(queryClient, taskId)
      if (original) {
        syncTaskInCache(queryClient, { ...original, ...normalizeTaskInput(data) } as Task)
      }
      return { previous }
    },
    rollback: (ctx) => rollbackCache(queryClient, ctx?.previous),
    invalidateKeys: [taskQueries.all],
    messages: {
      offline: 'Task update saved offline',
      success: 'Task updated',
      error: 'Failed to update task',
    },
  })
}

export function useCompleteTaskMutation() {
  const queryClient = useQueryClient()

  return useOfflineMutation<
    { taskId: string; minutes: number; notes?: string },
    { previous: ReturnType<typeof snapshotCache> }
  >({
    kind: 'task.complete',
    buildPayload: ({ taskId, minutes, notes }) => ({
      id: taskId,
      data: { actualMinutes: minutes, notes: notes || undefined },
    }),
    optimisticUpdate: ({ taskId, minutes }) => {
      const previous = snapshotCache(queryClient)
      const original = findTaskInCache(queryClient, taskId)
      if (original) {
        syncTaskInCache(queryClient, {
          ...original,
          status: 'DONE',
          actualMinutes: minutes,
          completedAt: new Date().toISOString(),
        })
      }
      return { previous }
    },
    rollback: (ctx) => rollbackCache(queryClient, ctx?.previous),
    invalidateKeys: [taskQueries.all, ['time-tracker'], ['goals']],
    messages: {
      offline: 'Task completion saved offline',
      success: 'Task completed and logged',
      error: 'Failed to complete task',
    },
    onServerSuccess: () => {
      capture(Events.TASK_COMPLETED, { source: 'list' })
    },
  })
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient()

  return useOfflineMutation<string, { previous: ReturnType<typeof snapshotCache> }>({
    kind: 'task.delete',
    buildPayload: (taskId) => ({ id: taskId }),
    optimisticUpdate: (taskId) => {
      const previous = snapshotCache(queryClient)
      syncTaskInCache(queryClient, { id: taskId } as Task, { isDeleted: true })
      return { previous }
    },
    rollback: (ctx) => rollbackCache(queryClient, ctx?.previous),
    invalidateKeys: [taskQueries.all],
    messages: {
      offline: 'Task deletion saved offline',
      success: 'Task deleted',
      error: 'Failed to delete task',
    },
  })
}

export function useRestoreTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => tasksApi.restore(taskId).then((res) => res.data),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: taskQueries.all })
      const previous = queryClient.getQueriesData({ queryKey: taskQueries.all })

      const original = findTaskInCache(queryClient, taskId)
      if (original) {
        syncTaskInCache(queryClient, {
          ...original,
          status: 'TODO',
          completedAt: undefined,
          actualMinutes: undefined,
        })
      }
      return { previous }
    },
    onSuccess: () => toast.success('Task restored'),
    onError: (_err, _vars, context) => {
      rollbackCache(queryClient, context?.previous)
      toast.error('Failed to restore task')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskQueries.all }),
  })
}

export function useReorderTasksMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await tasksApi.reorder(ids)
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: taskQueries.all })
      const previous = queryClient.getQueriesData({ queryKey: taskQueries.all })

      const activeLists = queryClient.getQueriesData<Task[]>({
        queryKey: taskQueries.all,
        type: 'active',
      })

      activeLists.forEach(([queryKey, data]) => {
        if (!Array.isArray(data) || queryKey[1] !== 'list') return

        const orderMap = new Map(ids.map((id, index) => [id, index]))
        const reordered = [...data].sort((a, b) => {
          const aOrder = orderMap.get(a.id)
          const bOrder = orderMap.get(b.id)
          if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder
          if (aOrder !== undefined) return -1
          if (bOrder !== undefined) return 1
          return 0
        })

        queryClient.setQueryData(queryKey, reordered)
      })

      return { previous }
    },
    onError: (_err, _vars, context) => {
      rollbackCache(queryClient, context?.previous)
      toast.error('Failed to reorder tasks')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskQueries.all }),
  })
}
