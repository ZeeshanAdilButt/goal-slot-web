import { taskQueries } from '@/features/tasks/utils/queries'
import { CreateTaskForm, Task, TaskStatus } from '@/features/tasks/utils/types'
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { tasksApi } from '@/lib/api'

// --- 1. TYPES & HELPERS ---

type TaskListFilters = { status?: TaskStatus; goalId?: string }

const normalizeTaskInput = (data: Partial<CreateTaskForm>) => ({
  ...data,
  goalId: data.goalId || undefined,
  scheduleBlockId: data.scheduleBlockId || undefined,
  dueDate: data.dueDate || undefined,
  estimatedMinutes: data.estimatedMinutes ? parseInt(data.estimatedMinutes) : undefined,
})

const getListFilters = (queryKey: readonly unknown[]): TaskListFilters | undefined => {
  return queryKey[2] as TaskListFilters | undefined
}

/**
 * Logic to determine if a task should reside in a specific filtered list.
 */
const matchesFilters = (task: Task, filters?: TaskListFilters) => {
  if (!filters) return true
  if (filters.status && task.status !== filters.status) return false
  if (filters.goalId && task.goalId !== filters.goalId) return false
  return true
}

/**
 * THE SYNC ENGINE
 * Automatically adds, updates, or removes a task from ALL active queries
 * based on whether the task still matches that query's filters.
 */
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

    // Find index by current ID or the temporary optimistic ID
    const existingIndex = data.findIndex(
      (t) => t.id === task.id || (options.optimisticId && t.id === options.optimisticId),
    )

    let newData = [...data]

    if (!shouldInclude) {
      // Remove if it no longer belongs here
      if (existingIndex === -1) return
      newData = newData.filter((_, i) => i !== existingIndex)
    } else {
      // Update existing or Add to top
      if (existingIndex >= 0) {
        newData[existingIndex] = task
      } else {
        newData = [task, ...newData]
      }
    }

    queryClient.setQueryData(queryKey, newData)
  })
}

/**
 * Standardized error recovery logic
 */
const handleMutationError = (queryClient: QueryClient, context: any, error: any, defaultMsg: string) => {
  if (context?.previous) {
    context.previous.forEach(([key, data]: any) => queryClient.setQueryData(key, data))
  }
  const message = error.response?.data?.message || defaultMsg
  toast.error(message, { id: context?.toastId })
}

// --- 2. MUTATION HOOKS ---

export function useCreateTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (form: CreateTaskForm) => {
      const res = await tasksApi.create(normalizeTaskInput(form))
      return res.data
    },
    onMutate: async (form) => {
      const toastId = toast.loading('Creating task...')
      await queryClient.cancelQueries({ queryKey: taskQueries.all })
      const previous = queryClient.getQueriesData({ queryKey: taskQueries.all })

      const optimisticId = `optimistic-${Date.now()}`
      const normalized = normalizeTaskInput(form)
      const optimisticTask: Task = {
        id: optimisticId,
        title: form.title,
        description: normalized.description || undefined,
        status: 'BACKLOG',
        category: normalized.category || undefined,
        estimatedMinutes: normalized.estimatedMinutes,
        goalId: normalized.goalId,
        scheduleBlockId: normalized.scheduleBlockId,
        dueDate: normalized.dueDate,
      } as Task

      syncTaskInCache(queryClient, optimisticTask)
      return { previous, optimisticId, toastId }
    },
    onSuccess: (createdTask, _, context) => {
      syncTaskInCache(queryClient, createdTask, { optimisticId: context?.optimisticId })
      toast.success('Task created', { id: context?.toastId })
    },
    onError: (err, _, context) => handleMutationError(queryClient, context, err, 'Failed to create task'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskQueries.all }),
  })
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      data,
    }: {
      taskId: string
      data: Partial<CreateTaskForm & { status?: TaskStatus }>
    }) => {
      const res = await tasksApi.update(taskId, {
        ...normalizeTaskInput(data),
      })
      return res.data
    },
    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({ queryKey: taskQueries.all })
      const previous = queryClient.getQueriesData({ queryKey: taskQueries.all })

      // Logic to find the current task state across cache to merge updates
      const allTasks = (previous as [any, Task[]][]).flatMap((l) => l[1] || [])
      const original = allTasks.find((t) => t.id === taskId)

      if (original) syncTaskInCache(queryClient, { ...original, ...normalizeTaskInput(data) } as Task)
      return { previous }
    },
    onSuccess: (updatedTask) => {
      syncTaskInCache(queryClient, updatedTask)
      toast.success('Task updated')
    },
    onError: (err, _, context) => handleMutationError(queryClient, context, err, 'Failed to update task'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskQueries.all }),
  })
}

export function useCompleteTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, minutes, notes }: { taskId: string; minutes: number; notes?: string }) => {
      const res = await tasksApi.complete(taskId, { actualMinutes: minutes, notes: notes || undefined })
      return res.data
    },
    onMutate: async ({ taskId, minutes }) => {
      await queryClient.cancelQueries({ queryKey: taskQueries.all })
      const previous = queryClient.getQueriesData({ queryKey: taskQueries.all })

      const allTasks = (previous as [any, Task[]][]).flatMap((l) => l[1] || [])
      const original = allTasks.find((t) => t.id === taskId)

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
    onSuccess: (data) => {
      if (data?.task) syncTaskInCache(queryClient, data.task)
      toast.success('Task completed and logged')
      // Invalidate related aggregates
      queryClient.invalidateQueries({ queryKey: ['time-tracker'] })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
    onError: (err, _, context) => handleMutationError(queryClient, context, err, 'Failed to complete task'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskQueries.all }),
  })
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => tasksApi.delete(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: taskQueries.all })
      const previous = queryClient.getQueriesData({ queryKey: taskQueries.all })

      syncTaskInCache(queryClient, { id: taskId } as Task, { isDeleted: true })
      return { previous }
    },
    onSuccess: () => toast.success('Task deleted'),
    onError: (err, _, context) => handleMutationError(queryClient, context, err, 'Failed to delete task'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskQueries.all }),
  })
}

export function useRestoreTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => tasksApi.restore(taskId).then((res) => res.data),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: taskQueries.all })
      const previous = queryClient.getQueriesData({ queryKey: taskQueries.all })

      const allTasks = (previous as [any, Task[]][]).flatMap((l) => l[1] || [])
      const original = allTasks.find((t) => t.id === taskId)

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
    onError: (err, _, context) => handleMutationError(queryClient, context, err, 'Failed to restore task'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskQueries.all }),
  })
}

export function useReorderTasksMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await tasksApi.reorder(ids)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueries.all })
    },
  })
}
