import { goalQueries } from '@/features/goals/utils/queries'
import { CreateGoalForm, Goal, GoalFilters, UpdateGoalForm } from '@/features/goals/utils/types'
import { labelQueries } from '@/features/labels'
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'

import { useOfflineMutation } from '@/hooks/use-offline-mutation'
import { goalsApi } from '@/lib/api'

import '@/features/goals/utils/offline-operations'

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

const snapshotGoals = (queryClient: QueryClient) => queryClient.getQueriesData({ queryKey: goalQueries.all })
const restoreGoals = (queryClient: QueryClient, previous?: ReturnType<typeof snapshotGoals>) =>
  previous?.forEach(([key, data]) => queryClient.setQueryData(key, data))

const findGoalInCache = (queryClient: QueryClient, id: string): Goal | undefined => {
  const lists = queryClient.getQueriesData<Goal[]>({ queryKey: goalQueries.all })
  for (const [, data] of lists) {
    if (!Array.isArray(data)) continue
    const found = data.find((goal) => goal.id === id)
    if (found) return found
  }
}

export function useCreateGoalMutation() {
  const queryClient = useQueryClient()

  return useOfflineMutation<CreateGoalForm, { previous: ReturnType<typeof snapshotGoals> }>({
    kind: 'goal.create',
    buildPayload: (data, meta) => ({ id: meta.entityId, ...data }),
    optimisticUpdate: (data, meta) => {
      const previous = snapshotGoals(queryClient)
      const optimisticGoal: Goal = {
        id: meta.entityId,
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
      return { previous }
    },
    rollback: (ctx) => restoreGoals(queryClient, ctx?.previous),
    invalidateKeys: [goalQueries.all, labelQueries.all()],
    messages: {
      offline: 'Goal saved offline',
      success: 'Goal created',
      error: 'Failed to create goal',
    },
  })
}

export function useUpdateGoalMutation() {
  const queryClient = useQueryClient()

  return useOfflineMutation<{ id: string; data: UpdateGoalForm }, { previous: ReturnType<typeof snapshotGoals> }>({
    kind: 'goal.update',
    buildPayload: ({ id, data }) => ({ id, data }),
    optimisticUpdate: ({ id, data }) => {
      const previous = snapshotGoals(queryClient)
      const original = findGoalInCache(queryClient, id)
      if (original) {
        syncGoalInCache(queryClient, { ...original, ...data, labels: original.labels })
      }
      return { previous }
    },
    rollback: (ctx) => restoreGoals(queryClient, ctx?.previous),
    invalidateKeys: [goalQueries.all, labelQueries.all()],
    messages: {
      offline: 'Goal update saved offline',
      success: 'Goal updated',
      error: 'Failed to update goal',
    },
  })
}

export function useDeleteGoalMutation() {
  const queryClient = useQueryClient()

  return useOfflineMutation<string, { previous: ReturnType<typeof snapshotGoals> }>({
    kind: 'goal.delete',
    buildPayload: (id) => ({ id }),
    optimisticUpdate: (id) => {
      const previous = snapshotGoals(queryClient)
      syncGoalInCache(queryClient, { id } as Goal, { isDeleted: true })
      return { previous }
    },
    rollback: (ctx) => restoreGoals(queryClient, ctx?.previous),
    invalidateKeys: [goalQueries.all],
    messages: {
      offline: 'Goal deletion saved offline',
      success: 'Goal deleted',
      error: 'Failed to delete goal',
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
