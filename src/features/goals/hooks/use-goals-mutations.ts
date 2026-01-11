import { goalQueries } from '@/features/goals/utils/queries'
import { CreateGoalForm, Goal, GoalFilters, UpdateGoalForm } from '@/features/goals/utils/types'
import { labelQueries } from '@/features/labels'
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { goalsApi } from '@/lib/api'

const getGoalFilters = (queryKey: readonly unknown[]): GoalFilters | undefined => queryKey[2] as GoalFilters | undefined

const matchesGoalFilters = (goal: Goal, filters?: GoalFilters) => {
  if (!filters) return true
  if (filters.status && goal.status !== filters.status) return false
  if (filters.categories?.length && !filters.categories.includes(goal.category)) return false
  if (filters.labelIds?.length) {
    if (!goal.labels || goal.labels.length === 0) return false
    const goalLabelIds = goal.labels.map((gl) => gl.labelId)
    if (!filters.labelIds.some((id) => goalLabelIds.includes(id))) return false
  }
  return true
}

const syncGoalInCache = (
  queryClient: QueryClient,
  goal: Goal,
  options: { isDeleted?: boolean; optimisticId?: string } = {},
) => {
  const activeLists = queryClient.getQueriesData<Goal[]>({ queryKey: goalQueries.all, type: 'active' })

  activeLists.forEach(([queryKey, data]) => {
    if (!Array.isArray(data) || queryKey[1] !== 'list') return

    const filters = getGoalFilters(queryKey)
    const shouldInclude = !options.isDeleted && matchesGoalFilters(goal, filters)
    const existingIndex = data.findIndex(
      (g) => g.id === goal.id || (options.optimisticId && g.id === options.optimisticId),
    )

    let next = [...data]

    if (!shouldInclude) {
      if (existingIndex === -1) return
      next = next.filter((_, i) => i !== existingIndex)
    } else if (existingIndex >= 0) {
      next[existingIndex] = goal
    } else {
      next = [goal, ...next]
    }

    queryClient.setQueryData(queryKey, next)
  })
}

const restoreGoals = (queryClient: QueryClient, previous: Array<[readonly unknown[], unknown]>) => {
  previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
}

export function useCreateGoalMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateGoalForm) => {
      const res = await goalsApi.create(data)
      return res.data
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: goalQueries.all })
      const previous = queryClient.getQueriesData({ queryKey: goalQueries.all })
      const optimisticGoal: Goal = {
        id: `optimistic-${Date.now()}`,
        title: data.title,
        description: data.description,
        category: data.category,
        targetHours: data.targetHours,
        loggedHours: 0,
        deadline: data.deadline,
        status: data.status || 'ACTIVE',
        color: data.color,
      }

      syncGoalInCache(queryClient, optimisticGoal)

      return { previous, optimisticId: optimisticGoal.id }
    },
    onSuccess: (createdGoal, _variables, context) => {
      if (createdGoal) {
        syncGoalInCache(queryClient, createdGoal, { optimisticId: context?.optimisticId })
      }
      toast.success('Goal created')
    },
    onError: (error: any, _variables, context) => {
      if (context?.previous) {
        restoreGoals(queryClient, context.previous)
      }
      console.error('Create goal error:', error?.response?.data || error)
      toast.error(error?.response?.data?.message || 'Failed to create goal')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: goalQueries.all })
      queryClient.invalidateQueries({ queryKey: labelQueries.all() })
    },
  })
}

export function useUpdateGoalMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateGoalForm }) => {
      const res = await goalsApi.update(id, data)
      return res.data
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: goalQueries.all })
      const previous = queryClient.getQueriesData({ queryKey: goalQueries.all })
      const allGoals = (previous as [readonly unknown[], Goal[]][])
        .flatMap(([, list]) => (Array.isArray(list) ? list : []))
      const original = allGoals.find((g) => g.id === id)

      if (original) {
        const optimisticGoal: Goal = {
          ...original,
          ...data,
          labels: original.labels,
        }
        syncGoalInCache(queryClient, optimisticGoal)
      }

      return { previous }
    },
    onSuccess: (updatedGoal) => {
      if (updatedGoal) {
        syncGoalInCache(queryClient, updatedGoal)
      }
      toast.success('Goal updated')
    },
    onError: (error: any, _variables, context) => {
      if (context?.previous) {
        restoreGoals(queryClient, context.previous)
      }
      console.error('Update goal error:', error?.response?.data || error)
      toast.error(error?.response?.data?.message || 'Failed to update goal')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: goalQueries.all })
      queryClient.invalidateQueries({ queryKey: labelQueries.all() })
    },
  })
}

export function useDeleteGoalMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await goalsApi.delete(id)
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: goalQueries.all })
      const previous = queryClient.getQueriesData({ queryKey: goalQueries.all })
      syncGoalInCache(queryClient, { id } as Goal, { isDeleted: true })
      return { previous }
    },
    onSuccess: () => {
      toast.success('Goal deleted')
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        restoreGoals(queryClient, context.previous)
      }
      toast.error('Failed to delete goal')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: goalQueries.all })
    },
  })
}

export function useReorderGoalsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await goalsApi.reorder(ids)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: goalQueries.all })
    },
  })
}
