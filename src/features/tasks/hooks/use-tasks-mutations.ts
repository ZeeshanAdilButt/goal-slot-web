import { taskQueries } from '@/features/tasks/utils/queries'
import { CreateTaskForm, TaskStatus } from '@/features/tasks/utils/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { tasksApi } from '@/lib/api'

export function useCreateTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (form: CreateTaskForm) =>
      tasksApi.create({
        title: form.title,
        description: form.description,
        category: form.category,
        estimatedMinutes: form.estimatedMinutes ? parseInt(form.estimatedMinutes) : undefined,
        goalId: form.goalId || undefined,
        scheduleBlockId: form.scheduleBlockId || undefined,
        dueDate: form.dueDate || undefined,
      }),
    onSuccess: () => {
      toast.success('Task created')
      queryClient.invalidateQueries({ queryKey: taskQueries.all })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create task')
    },
  })
}

export function useCompleteTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, minutes, notes }: { taskId: string; minutes: number; notes?: string }) =>
      tasksApi.complete(taskId, {
        actualMinutes: minutes,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      toast.success('Task completed and logged')
      queryClient.invalidateQueries({ queryKey: taskQueries.all })
      // Also invalidate time entries if we had a way to reference them easily,
      // but for now tasks list update is most important
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to complete task')
    },
  })
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Partial<CreateTaskForm & { status?: TaskStatus }> }) =>
      tasksApi.update(taskId, {
        title: data.title,
        description: data.description,
        category: data.category,
        estimatedMinutes: data.estimatedMinutes ? parseInt(data.estimatedMinutes) : undefined,
        goalId: data.goalId || undefined,
        scheduleBlockId: data.scheduleBlockId || undefined,
        dueDate: data.dueDate || undefined,
        status: data.status,
      }),
    onSuccess: () => {
      toast.success('Task updated')
      queryClient.invalidateQueries({ queryKey: taskQueries.all })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update task')
    },
  })
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => tasksApi.delete(taskId),
    onSuccess: () => {
      toast.success('Task deleted')
      queryClient.invalidateQueries({ queryKey: taskQueries.all })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete task')
    },
  })
}
